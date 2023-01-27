import React from 'react';
import Link from '@cloudscape-design/components/link';

export const InfoLink = ({ id, onFollow, ariaLabel }) => (
  <Link variant="info" id={id} onFollow={onFollow} ariaLabel={ariaLabel}>
    Info
  </Link>
);