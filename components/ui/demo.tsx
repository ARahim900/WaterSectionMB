// FIX: Replaced placeholder content with a valid React component to resolve module errors.
// This component provides an alternative KPI card style.
"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card(props, ref) {
    const { className, ...rest } = props;
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(
          "bg-white text-gray-900 flex flex-col gap-6 rounded-xl border border-gray-200 p-6 shadow-sm",
          className
        )}
        {...rest}
      />
    );
  }
);
Card.displayName = "Card";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent(props, ref) {
    const { className, ...rest } = props;
    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn("p-0", className)}
        {...rest}
      />
    );
  }
);
CardContent.displayName = "CardContent";

const data = [
  {
    name: "Total Consumption",
    value: "1.2M m³",
    change: "+2.5%",
    changeType: "negative",
  },
  {
    name: "System Loss",
    value: "150K m³",
    change: "-3.1%",
    changeType: "positive", // Less loss is good
  },
  {
    name: "Efficiency",
    value: "87.5%",
    change: "+1.5%",
    changeType: "positive",
  },
];

export default function Stats07() {
  return (
    <div className="flex items-center justify-center w-full">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {data.map((item) => (
          <Card key={item.name}>
            <CardContent>
              <dd className="flex items-center justify-between space-x-2">
                <span className="truncate text-sm text-gray-500">
                  {item.name}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-x-1 rounded-full px-2 py-1 text-xs font-medium",
                    item.changeType === "positive"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {item.change}
                </span>
              </dd>
              <dd className="mt-2 text-3xl font-semibold text-gray-900">
                {item.value}
              </dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  );
}
