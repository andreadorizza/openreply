import type { Contributor } from "./github-shared";

function plural(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "contribution" : "contributions"}`;
}

export function ContributorsView({ contributors }: { contributors: Contributor[] }) {
  const top = contributors.slice(0, 3);
  const total = contributors.reduce((sum, c) => sum + c.contributions, 0);

  return (
    <>
      <p className="contrib-stats body-5">
        <span>
          <b>{contributors.length}</b>{" "}
          {contributors.length === 1 ? "contributor" : "contributors"}
        </span>
        <span>
          <b>{total.toLocaleString()}</b>{" "}
          {total === 1 ? "contribution" : "contributions"}
        </span>
      </p>

      <h2 className="heading-5 contrib-heading">Top contributors</h2>
      <ul className="contrib-top">
        {top.map((person) => (
          <li key={person.login}>
            <a className="contrib-card" href={person.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={person.avatar} alt="" width={80} height={80} loading="lazy" />
              <strong className="title-2">{person.login}</strong>
              <span className="body-6 muted">{plural(person.contributions)}</span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="heading-5 contrib-heading">All contributors</h2>
      <ul className="contrib-grid">
        {contributors.map((person) => (
          <li key={person.login}>
            <a className="contrib-row" href={person.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={person.avatar} alt="" width={40} height={40} loading="lazy" />
              <span>
                <strong className="title-4">{person.login}</strong>
                <span className="caption-5 muted">{plural(person.contributions)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
