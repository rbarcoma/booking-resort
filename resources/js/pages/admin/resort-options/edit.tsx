import { Head, useForm } from '@inertiajs/react';

type Option = {
    id: number;
    name: string;
    image: string | null;
    price: number;
    max_pax: number;
    description: string | null;
    status: string;
};

export default function ResortOptions({ options }: { options: Option[] }) {
    return (
        <>
            <Head title="Resort Options" />

            <div className="p-8 space-y-6">
                <h1 className="text-3xl font-bold">Manage Resort Options</h1>

                {options.map((option) => (
                    <EditCard key={option.id} option={option} />
                ))}
            </div>
        </>
    );
}

function EditCard({ option }: { option: Option }) {
    const { data, setData, post, processing } = useForm({
        price: option.price,
        max_pax: option.max_pax,
        description: option.description || '',
        status: option.status,
        image: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/resort-options/${option.id}`);
    };

    return (
        <form onSubmit={submit} className="rounded-xl border p-6 space-y-4 bg-white shadow">
            <h2 className="text-xl font-bold">{option.name}</h2>

            {option.image && (
                <img
                    src={`/storage/${option.image}`}
                    className="w-full h-48 object-cover rounded"
                />
            )}

            <input type="file" onChange={(e) => setData('image', e.target.files?.[0] || null)} />

            <input
                type="number"
                value={data.price}
                onChange={(e) => setData('price', Number(e.target.value))}
                className="w-full border p-2 rounded"
                placeholder="Price"
            />

            <input
                type="number"
                value={data.max_pax}
                onChange={(e) => setData('max_pax', Number(e.target.value))}
                className="w-full border p-2 rounded"
                placeholder="Max Pax"
            />

            <textarea
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Description"
            />

            <select
                value={data.status}
                onChange={(e) => setData('status', e.target.value)}
                className="w-full border p-2 rounded"
            >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>

            <button
                type="submit"
                disabled={processing}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                Save Changes
            </button>
        </form>
    );
}
