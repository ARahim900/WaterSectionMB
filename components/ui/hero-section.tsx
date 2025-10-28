"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { cn } from "@/lib/utils";

interface HeroAction {
  text: string;
  href?: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow" | "secondary" | "outline" | "ghost" | "link";
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({ badge, title, description, actions, image }: HeroProps) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const update = (event?: MediaQueryListEvent) => {
      setIsDark(event ? event.matches : mediaQuery.matches);
    };

    update();
    const listener = (event: MediaQueryListEvent) => update(event);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const imageSrc = isDark ? image.dark : image.light;

  return (
    <section
      className={cn(
        "overflow-hidden bg-background pb-0 text-foreground",
        "py-12 sm:py-24 md:py-32 px-4",
        "fade-bottom"
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {badge && (
            <Badge variant="outline" className="animate-appear gap-2">
              <span className="text-muted-foreground">{badge.text}</span>
              <a href={badge.action.href} className="flex items-center gap-1 text-sm font-medium">
                {badge.action.text}
                <ArrowRight className="h-3 w-3" />
              </a>
            </Badge>
          )}

          <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-4xl font-semibold leading-tight text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-7xl md:leading-tight">
            {title}
          </h1>

          <p className="text-md relative z-10 max-w-[620px] animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
            {description}
          </p>

          <div className="relative z-10 flex animate-appear justify-center gap-4 opacity-0 delay-300">
            {actions.map((action, index) => {
              const { href, onClick, variant, icon } = action;

              if (href) {
                return (
                  <Button
                    key={`${action.text}-${index}`}
                    variant={variant}
                    size="lg"
                    asChild
                    onClick={onClick}
                  >
                    <a href={href} className="flex items-center gap-2">
                      {icon}
                      {action.text}
                    </a>
                  </Button>
                );
              }

              return (
                <Button
                  key={`${action.text}-${index}`}
                  variant={variant}
                  size="lg"
                  onClick={onClick}
                  className="flex items-center gap-2"
                >
                  {icon}
                  {action.text}
                </Button>
              );
            })}
          </div>

          <div className="relative pt-12">
            <MockupFrame className="animate-appear opacity-0 delay-700" size="small">
              <Mockup type="responsive" className="bg-muted/40">
                <img
                  src={imageSrc}
                  alt={image.alt}
                  width={1248}
                  height={765}
                  loading="eager"
                  className="h-auto w-full object-cover"
                />
              </Mockup>
            </MockupFrame>
            <Glow variant="top" className="animate-appear-zoom opacity-0 delay-1000" />
          </div>
        </div>
      </div>
    </section>
  );
}
