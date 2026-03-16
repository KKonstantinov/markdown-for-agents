import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export default function AboutPage() {
    return (
        <>
            <Nav />
            <main>
                <h1>About</h1>
                <p>
                    This page demonstrates the <strong>proxy pattern</strong> for site-wide markdown conversion.
                </p>
                <p>
                    When an AI agent sends <code>Accept: text/markdown</code>, the proxy intercepts the request and converts the HTML
                    response to markdown automatically.
                </p>
            </main>
            <Footer />
        </>
    );
}
