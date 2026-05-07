import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CmsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function OldCmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
