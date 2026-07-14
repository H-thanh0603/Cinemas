import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types";
import { Card } from "@/components/ui";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full overflow-hidden transition hover:border-brand-500/30">
        <div className="relative aspect-[16/9] bg-surface-800">
          <Image
            src={post.cover}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </div>
        <div className="p-5">
          <p className="text-xs text-surface-500">
            {new Date(post.date).toLocaleDateString("vi-VN")} · {post.author}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white line-clamp-2">
            {post.title}
          </h2>
          <p className="mt-2 text-sm text-surface-400 line-clamp-3">
            {post.excerpt}
          </p>
        </div>
      </Card>
    </Link>
  );
}
