import type { MDXComponents } from "mdx/types";

// Body styles for build-log posts (/log/[slug], LogPost.dc.html, design update 12): serif 20px/1.6, H2 30px.
const components: MDXComponents = {
  p: (props) => <p className="m-0 font-serif text-[20px] leading-[1.6]" {...props} />,
  h2: (props) => <h2 className="mt-3 mb-0 font-serif text-[30px] font-normal leading-[1.2]" {...props} />,
  a: (props) => <a className="text-accent" {...props} />,
  // Lists in the same serif body type (Tailwind's preflight strips list markers).
  ul: (props) => <ul className="m-0 flex list-disc flex-col gap-2 pl-[1.2em] font-serif text-[20px] leading-[1.6]" {...props} />,
  ol: (props) => <ol className="m-0 flex list-decimal flex-col gap-2 pl-[1.2em] font-serif text-[20px] leading-[1.6]" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
