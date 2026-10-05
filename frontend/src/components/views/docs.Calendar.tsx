import type { Meta, StoryObj } from '@storybook/tanstack-react';

import { CalendarView } from './Calendar';

import { EXAMPLE_EVENTS } from '../../mocks/events';
import { SEED_ORGS } from '../../mocks/orgs';

const meta = {
  title: "Components/Calendar",
  component: CalendarView,
} satisfies Meta<typeof CalendarView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "events": EXAMPLE_EVENTS,
    orgs: SEED_ORGS,
    span: "month",
    showLegend: true,
    onSelect: () => {},
    // The fixtures are all in June 2026, so pin the calendar there. In the app
    // this comes from the route's fetch window; a story has no window, and
    // without it the calendar would open on the current month and look empty.
    rangeStart: "2026-06-01",
    onWindowChange: () => {},
  },
};