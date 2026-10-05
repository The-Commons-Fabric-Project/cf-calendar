import { fn } from "storybook/test";
import type { Meta, StoryObj } from '@storybook/tanstack-react';

import FilterBar from './FilterBar';

const meta = {
  component: FilterBar,
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    matches: 12,
    rangeStart: "2026-06-01",
    rangeEnd: "2026-06-30",
    setRangeStart: fn(),
    setRangeEnd: fn(),
  },
};