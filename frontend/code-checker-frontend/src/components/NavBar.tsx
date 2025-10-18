import React from 'react';
import { Link } from 'react-router-dom';


export default function NavBar() {
return (
<header className="bg-white dark:bg-slate-800 shadow">
<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded flex items-center justify-center text-white font-bold">CC</div>
<Link to="/" className="font-semibold">CodeChecker</Link>
</div>
<nav className="flex items-center gap-4">
<Link to="/">Dashboard</Link>
<Link to="/rulesets">Rulesets</Link>
</nav>
</div>
</header>
);
}