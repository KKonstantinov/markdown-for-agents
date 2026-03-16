export function FeatureList({ items }: { items: string[] }) {
    return (
        <ul>
            {items.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}
