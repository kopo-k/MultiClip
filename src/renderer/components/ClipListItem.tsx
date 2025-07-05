import React from 'react';

type Props = {
  content: string;
};

const ClipListItem = ({ content }: Props) => {
  return (
    <li className="bg-gray-100 p-2 rounded shadow text-sm text-gray-700 truncate">
      {content}
    </li>
  );
};

export default ClipListItem;
