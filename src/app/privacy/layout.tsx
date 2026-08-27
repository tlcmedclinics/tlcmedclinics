/**
 * A pass-through.
 *
 * This layout existed to carry `metadata` for a privacy page that was a client
 * component and therefore could not export any. That page is now a server
 * component and states its own, so the metadata lives beside the content it
 * describes. Two sources for one page's title is how a description ends up
 * describing something the page no longer says.
 *
 * Kept rather than deleted so the route's segment structure is unchanged; it
 * can go whenever someone is tidying.
 */
export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
