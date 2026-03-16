import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { FeatureList } from '@/components/feature-list';

export default function HomePage() {
    return (
        <>
            <Nav />
            <main>
                <h1>Welcome</h1>
                <p>
                    This is the home page of the <strong>markdown-for-agents</strong> Next.js example.
                </p>
                <FeatureList items={['Content extraction strips nav and footer', 'Markdown conversion preserves structure']} />
            </main>
            <Footer />
        </>
    );
}
