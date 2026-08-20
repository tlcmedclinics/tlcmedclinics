/**
 * Renders a schema.org payload as a JSON-LD script tag.
 *
 * A server component with no state. It exists so pages describe their
 * structured data as objects and never hand-write JSON into a template — which
 * is how malformed schema, and XSS through an unescaped `</script>`, happen.
 *
 * Some of this data is admin-authored (blog titles, service copy), so `<` is
 * escaped: a post titled with a literal `</script>` would otherwise close the
 * tag early and inject the rest of the title as markup.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
