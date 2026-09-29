# Front End Components

Organization is WIP. Current attempt: organize components by hierarchy of increasing complexity.

Design mentioned that information architecture is WIP, which would really be a helpful mirror for component hierarchy. Update this organization when that happens.

1. [Chips](./_chips/README.md)
2. [Controls](./_controls/) - user inputs like toggles, text fields
3. [Cards](./cards/README.md) - basic units of information that a user can quickly scan, displaying just the key details of a data object (org, event, etc.)
4. [Modules?](./nav/) - intermediate level of complexity, or components that control the flow of other components, like the header bar (Header.tsx) or filtering (FilterBar.tsx). Unsure where [modals](./modals/) belong.
5. [Views???](./views/) - more complex arrangements of the smaller components -- maybe "panels" is a better label?
6. [Routes](../routes) - routes count as pages, the highest level of complexity loaded by the browser
