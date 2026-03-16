export function FeatureList({ items }: Readonly<{ items: string[] }>) {
    return (
        <ul>
            {items.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}
