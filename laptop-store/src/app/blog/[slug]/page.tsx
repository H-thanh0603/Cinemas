import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { blogPosts, getBlogBySlug } from "@/data";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) return { title: "Không tìm thấy" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n\n+/).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <p className="text-sm text-surface-500">
        {new Date(post.date).toLocaleDateString("vi-VN")} · {post.author}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {post.title}
      </h1>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-white/5 bg-surface-900">
        <Image
          src={post.cover}
          alt=""
          fill
          className="object-cover"
          sizes="800px"
          priority
        />
      </div>
      <div className="prose-invert mt-8 space-y-4 text-base leading-relaxed text-surface-300">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
