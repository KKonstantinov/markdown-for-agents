export function Footer({ year = new Date().getFullYear() }: { year?: number }) {
    return (
        <footer>
            <p>&copy; {year} markdown-for-agents</p>
        </footer>
    );
}
