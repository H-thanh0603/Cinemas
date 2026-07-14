import { blogPosts } from "@/data";
import { BlogCard } from "@/components/blog/blog-card";
import { SectionHeading } from "@/components/ui";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeading
        title="Blog TechZone"
        subtitle="Kiến thức chọn laptop và bảo quản máy"
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
