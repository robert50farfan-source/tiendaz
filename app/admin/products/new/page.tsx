import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Nuevo producto
      </h1>
      <ProductForm />
    </div>
  );
}
