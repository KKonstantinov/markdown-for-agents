const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/article', label: 'Article' }
];

export function Nav() {
    return (
        <nav>
            {links.map(({ href, label }) => (
                <a key={href} href={href}>
                    {label}
                </a>
            ))}
        </nav>
    );
}
