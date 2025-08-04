import Link from 'next/link';

export default function Page() {
  return (
    <div>
      <h1>Axiom AI Examples</h1>
      <p>Choose an example to explore:</p>
      <ul>
        <li>
          <Link href="/generate-text">Generate Text Example</Link>
        </li>
        <li>
          <Link href="/stream-text">Stream Text Example</Link>
        </li>
      </ul>
    </div>
  );
}
