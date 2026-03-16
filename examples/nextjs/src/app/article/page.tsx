import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { FeatureList } from '@/components/feature-list';

export default function ArticlePage() {
    return (
        <>
            <Nav />
            <main>
                <h1>Sample Article</h1>
                <p>
                    This is a <strong>sample article</strong> demonstrating the route handler pattern.
                </p>
                <h2>Key Features</h2>
                <FeatureList
                    items={[
                        'Content negotiation via Accept header',
                        'Automatic HTML to markdown conversion',
                        'Token estimation in response headers'
                    ]}
                />
                <p>
                    Visit <a href="https://example.com">Example</a> for more information.
                </p>
            </main>
            <Footer />
        </>
    );
}
