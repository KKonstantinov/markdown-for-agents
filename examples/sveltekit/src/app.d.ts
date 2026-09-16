declare global {
    namespace App {
        interface Locals {
            markdownForAgentsExample?: boolean;
        }
    }
}

export type SvelteKitExampleLocals = App.Locals;
