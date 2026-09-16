import { sequence } from '@sveltejs/kit/hooks';
import { markdown } from '@markdown-for-agents/sveltekit';
import type { Handle } from '@sveltejs/kit';

const localsHandle: Handle = async ({ event, resolve }) => {
    event.locals.markdownForAgentsExample = true;
    return resolve(event);
};

export const handle = sequence(
    localsHandle,
    markdown({
        extract: true,
        deduplicate: true,
        contentSignal: { aiTrain: true, search: true, aiInput: true },
        serverTiming: true
    })
);
