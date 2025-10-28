"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card(props, ref) {
    const { className, ...rest } = props;
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(
          "bg-white text-gray-900 flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm",
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
        className={cn("px-6", className)}
        {...rest}
      />
    );
  }
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter(props, ref) {
    const { className, ...rest } = props;
    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
        {...rest}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

// FIX: Updated placeholder data to be relevant to water consumption dashboard for better UX.
const data = [
  {
    name: "Avg. Daily Consumption",
    value: "45,210 m³",
    change: "+2.1%",
    changeType: "negative", // Increase in consumption is generally not positive
    href: "#",
  },
  {
    name: "Active Meters",
    value: "1,234",
    change: "+12",
    changeType: "positive",
    href: "#",
  },
  {
    name: "Meters with Zero Reading",
    value: "27",
    change: "-3",
    changeType: "positive", // A decrease in non-reporting meters is good
    href: "#",
  },
];

export default function Stats05() {
  return (
    <div className="flex items-center justify-center w-full">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {data.map((item) => (
          <Card key={item.name} className="p-0 gap-0">
            <CardContent className="p-6">
              <dd className="flex items-start justify-between space-x-2">
                <span className="truncate text-sm text-gray-500">
                  {item.name}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.changeType === "positive"
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {item.change}
                </span>
              </dd>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {item.value}
              </dd>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-gray-200 !p-0">
              <a
                href={item.href}
                className="px-6 py-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View more →
              </a>
            </CardFooter>
          </Card>
        ))}
      </dl>
    </div>
  );
}