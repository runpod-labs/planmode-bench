"""Tests for the Top-A sampling strategy added to vLLM.

Top-A sampling keeps only tokens whose probability is at least
a * max(probability), then renormalizes.
"""

import pytest
import torch


class TestSamplingParamsTopA:
    """Tests that SamplingParams correctly accepts and validates top_a."""

    def test_default_top_a_is_zero(self):
        """top_a should default to 0.0 (disabled)."""
        from vllm.sampling_params import SamplingParams

        params = SamplingParams()
        assert params.top_a == 0.0

    def test_accepts_valid_top_a(self):
        """SamplingParams should accept top_a in [0.0, 1.0]."""
        from vllm.sampling_params import SamplingParams

        for value in [0.0, 0.1, 0.5, 0.9, 1.0]:
            params = SamplingParams(top_a=value)
            assert params.top_a == value

    def test_rejects_negative_top_a(self):
        """top_a below 0.0 should raise an error."""
        from vllm.sampling_params import SamplingParams

        with pytest.raises((ValueError, Exception)):
            SamplingParams(top_a=-0.1)

    def test_rejects_top_a_above_one(self):
        """top_a above 1.0 should raise an error."""
        from vllm.sampling_params import SamplingParams

        with pytest.raises((ValueError, Exception)):
            SamplingParams(top_a=1.5)

    def test_top_a_coexists_with_other_params(self):
        """top_a should work alongside top_p and top_k."""
        from vllm.sampling_params import SamplingParams

        params = SamplingParams(top_a=0.3, top_p=0.9, top_k=50, temperature=0.8)
        assert params.top_a == 0.3
        assert params.top_p == 0.9
        assert params.top_k == 50


class TestTopAFilteringLogic:
    """Tests for the actual Top-A filtering behavior on logits/probabilities.

    These tests directly verify the mathematical properties of Top-A sampling
    without requiring the full vLLM inference pipeline.
    """

    @staticmethod
    def _apply_top_a_reference(probs: torch.Tensor, top_a: float) -> torch.Tensor:
        """Reference implementation of Top-A filtering.

        Given a probability distribution, zero out tokens where
        p(token) < top_a * max(p), then renormalize.
        """
        if top_a == 0.0:
            return probs.clone()
        max_probs = probs.max(dim=-1, keepdim=True).values
        threshold = top_a * max_probs
        filtered = probs.clone()
        filtered[filtered < threshold] = 0.0
        # Renormalize
        sums = filtered.sum(dim=-1, keepdim=True)
        filtered = filtered / sums
        return filtered

    def test_top_a_zero_keeps_all_tokens(self):
        """top_a=0.0 should keep the entire distribution unchanged."""
        probs = torch.tensor([[0.4, 0.3, 0.2, 0.1]])
        result = self._apply_top_a_reference(probs, 0.0)
        assert torch.allclose(result, probs, atol=1e-6)

    def test_top_a_one_keeps_only_max(self):
        """top_a=1.0 should keep only the token(s) with the highest prob."""
        probs = torch.tensor([[0.5, 0.3, 0.15, 0.05]])
        result = self._apply_top_a_reference(probs, 1.0)
        # Only the max token (index 0) should survive
        assert result[0, 0].item() == pytest.approx(1.0, abs=1e-6)
        assert result[0, 1].item() == pytest.approx(0.0, abs=1e-6)
        assert result[0, 2].item() == pytest.approx(0.0, abs=1e-6)
        assert result[0, 3].item() == pytest.approx(0.0, abs=1e-6)

    def test_top_a_half_filters_correctly(self):
        """top_a=0.5 should keep tokens with prob >= 0.5 * max_prob."""
        # max_prob = 0.4, threshold = 0.2
        # Tokens with prob >= 0.2: 0.4, 0.3, 0.2 (kept); 0.1 (dropped)
        probs = torch.tensor([[0.4, 0.3, 0.2, 0.1]])
        result = self._apply_top_a_reference(probs, 0.5)
        # Token at index 3 (prob 0.1) should be zeroed
        assert result[0, 3].item() == pytest.approx(0.0, abs=1e-6)
        # Remaining tokens should be nonzero
        assert result[0, 0].item() > 0
        assert result[0, 1].item() > 0
        assert result[0, 2].item() > 0

    def test_renormalization_sums_to_one(self):
        """After Top-A filtering, the remaining distribution must sum to 1."""
        probs = torch.tensor([[0.4, 0.3, 0.2, 0.1]])
        for a in [0.0, 0.25, 0.5, 0.75, 1.0]:
            result = self._apply_top_a_reference(probs, a)
            assert result.sum(dim=-1).item() == pytest.approx(1.0, abs=1e-5), (
                f"Distribution did not sum to 1.0 for top_a={a}"
            )

    def test_top_a_batched(self):
        """Top-A should work correctly across a batch of sequences."""
        probs = torch.tensor([
            [0.5, 0.3, 0.15, 0.05],
            [0.25, 0.25, 0.25, 0.25],
        ])
        # For row 0 with a=0.5: threshold = 0.25, keep 0.5 and 0.3
        result_0 = self._apply_top_a_reference(probs[0:1], 0.5)
        assert result_0[0, 2].item() == pytest.approx(0.0, abs=1e-6)
        assert result_0[0, 3].item() == pytest.approx(0.0, abs=1e-6)

        # For row 1 (uniform) with a=0.5: threshold = 0.125, all kept
        result_1 = self._apply_top_a_reference(probs[1:2], 0.5)
        assert all(result_1[0, i].item() > 0 for i in range(4))

    def test_top_a_with_ties_at_max(self):
        """When multiple tokens share the max probability, all should be kept."""
        probs = torch.tensor([[0.3, 0.3, 0.3, 0.1]])
        # a=1.0, threshold = 0.3 => keep tokens with prob >= 0.3
        result = self._apply_top_a_reference(probs, 1.0)
        assert result[0, 0].item() > 0
        assert result[0, 1].item() > 0
        assert result[0, 2].item() > 0
        assert result[0, 3].item() == pytest.approx(0.0, abs=1e-6)


class TestTopAIntegration:
    """Integration tests verifying that top_a flows through vLLM's pipeline."""

    def test_sampling_params_top_a_attribute_type(self):
        """top_a on SamplingParams should be a float."""
        from vllm.sampling_params import SamplingParams

        params = SamplingParams(top_a=0.5)
        assert isinstance(params.top_a, float)

    def test_sampling_params_repr_includes_top_a(self):
        """The string representation should mention top_a when set."""
        from vllm.sampling_params import SamplingParams

        params = SamplingParams(top_a=0.7)
        text = repr(params)
        assert "top_a" in text or "0.7" in text

    def test_sampling_params_clone_preserves_top_a(self):
        """If SamplingParams supports cloning/copying, top_a should survive."""
        import copy
        from vllm.sampling_params import SamplingParams

        original = SamplingParams(top_a=0.42)
        cloned = copy.deepcopy(original)
        assert cloned.top_a == 0.42

    def test_top_a_in_sampler_file(self):
        """The sampler module should reference top_a (smoke test for wiring)."""
        import inspect
        from vllm.model_executor.layers import sampler

        source = inspect.getsource(sampler)
        assert "top_a" in source, (
            "The sampler module does not reference 'top_a'. "
            "Make sure the Top-A filtering logic is wired into the sampling pipeline."
        )
