import Link from "next/link";
import Image from "next/image";
import { blogPosts } from "@/data";
import { Card, SectionHeading } from "@/components/ui";

export function BlogTeaser() {
  const posts = blogPosts.slice(0, 3);
  return (
    <section>
      <SectionHeading
        title="Từ blog TechZone"
        subtitle="Mẹo chọn máy và bảo quản"
        action={
          <Link href="/blog" className="text-sm text-brand-400 hover:text-brand-300">
            Tất cả bài viết →
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="h-full overflow-hidden transition hover:border-brand-500/30">
              <div className="relative aspect-[16/10] bg-surface-800">
                <Image
                  src={post.cover}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="33vw"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-surface-500">
                  {new Date(post.date).toLocaleDateString("vi-VN")}
                </p>
                <h3 className="mt-1 font-semibold text-white line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-surface-400 line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
