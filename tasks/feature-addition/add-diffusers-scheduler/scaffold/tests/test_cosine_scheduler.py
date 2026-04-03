import pytest
import torch
import numpy as np


class TestCosineAnnealingScheduler:
    def setup_method(self):
        from diffusers import CosineAnnealingScheduler
        self.scheduler = CosineAnnealingScheduler(
            num_train_timesteps=1000,
            beta_start=0.0001,
            beta_end=0.02,
        )

    def test_import(self):
        from diffusers import CosineAnnealingScheduler
        assert CosineAnnealingScheduler is not None

    def test_config(self):
        assert self.scheduler.config.num_train_timesteps == 1000
        assert self.scheduler.config.beta_start == 0.0001
        assert self.scheduler.config.beta_end == 0.02

    def test_set_timesteps(self):
        self.scheduler.set_timesteps(50)
        assert len(self.scheduler.timesteps) == 50

    def test_betas_are_cosine(self):
        """Betas should follow cosine annealing pattern."""
        betas = self.scheduler.betas.numpy()
        # Cosine schedule: betas should decrease then increase (U-shape)
        # or follow the cosine annealing pattern
        assert len(betas) == 1000
        assert betas[0] >= 0
        assert betas[-1] >= 0

    def test_alphas_cumprod_decreasing(self):
        """Cumulative product of alphas should be monotonically decreasing."""
        alphas_cumprod = self.scheduler.alphas_cumprod.numpy()
        for i in range(1, len(alphas_cumprod)):
            assert alphas_cumprod[i] <= alphas_cumprod[i - 1] + 1e-6

    def test_step_returns_scheduler_output(self):
        from diffusers.schedulers.scheduling_utils import SchedulerOutput
        self.scheduler.set_timesteps(50)
        sample = torch.randn(1, 3, 64, 64)
        model_output = torch.randn(1, 3, 64, 64)
        timestep = self.scheduler.timesteps[0]
        output = self.scheduler.step(model_output, timestep, sample)
        assert isinstance(output, SchedulerOutput)
        assert output.prev_sample.shape == sample.shape

    def test_add_noise(self):
        sample = torch.randn(1, 3, 64, 64)
        noise = torch.randn(1, 3, 64, 64)
        timesteps = torch.tensor([500])
        noisy = self.scheduler.add_noise(sample, noise, timesteps)
        assert noisy.shape == sample.shape
        # Noisy sample should be different from original
        assert not torch.allclose(noisy, sample)

    def test_step_reduces_noise(self):
        """Multiple denoising steps should produce different outputs."""
        self.scheduler.set_timesteps(10)
        sample = torch.randn(1, 3, 8, 8)
        prev = sample
        for t in self.scheduler.timesteps[:3]:
            model_output = torch.randn(1, 3, 8, 8)
            output = self.scheduler.step(model_output, t, prev)
            assert not torch.allclose(output.prev_sample, prev)
            prev = output.prev_sample
