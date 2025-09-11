import type React from "react";

const headingStyles = {
  h1: "scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance",
  h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
};

interface HeadingProps {
  as?: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  className?: string;
}

export const Heading = ({
  as: Component = "h1",
  children,
  className = "",
  ...props
}: HeadingProps) => {
  const baseStyles = headingStyles[Component] || headingStyles.h1;

  return (
    <Component className={`${baseStyles} ${className}`} {...props}>
      {children}
    </Component>
  );
};
