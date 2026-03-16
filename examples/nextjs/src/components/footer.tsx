export function Footer({ year = new Date().getFullYear() }: Readonly<{ year?: number }>) {
    return (
        <footer>
            <p>&copy; {year} markdown-for-agents</p>
        </footer>
    );
}
