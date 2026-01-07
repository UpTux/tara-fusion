import React from "react";

export const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* head */}
    <circle cx="12" cy="8" r="4" />
    {/* shoulder */}
    <path d="M4 20c0-4 16-4 16 0" />
  </svg>
);
