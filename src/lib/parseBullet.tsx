import React from 'react';

export function renderBullet(
  bullet: string,
  bodyColor: string,
  mutedColor: string
): React.ReactNode {
  const match = bullet.match(/^(.+?)\s—\s(.+)$/);
  if (match) {
    return (
      <>
        <span style={{ fontWeight: 600, color: bodyColor }}>{match[1]}</span>
        <span style={{ color: mutedColor }}> {match[2]}</span>
      </>
    );
  }
  return <span style={{ color: bodyColor }}>{bullet}</span>;
}
