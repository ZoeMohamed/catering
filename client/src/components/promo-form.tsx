import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { insertPromoSchema } from "@shared/schema";
import type { InsertPromo, Promo } from "@shared/schema";

interface PromoFormProps {
    promo?: Promo | null;
    onSubmit: (data: InsertPromo) => void;
    onCancel: () => void;
    isPending: boolean;
}

export function PromoForm({ promo, onSubmit, onCancel, isPending }: PromoFormProps) {
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm<InsertPromo>({
        resolver: zodResolver(insertPromoSchema),
        defaultValues: {
            title: promo?.title || "",
            code: promo?.code || "",
            description: promo?.description || "",
            discountType: promo?.discountType || "percent",
            discountValue: promo?.discountValue?.toString() || "0",
            startDate: promo?.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : "",
            endDate: promo?.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : "",
            isActive: promo?.isActive ?? true,
        },
    });

    const handleFormSubmit = (data: InsertPromo) => {
        onSubmit({
            ...data,
            discountValue: data.discountValue.toString(),
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="title">Judul Promo</Label>
                    <Input id="title" placeholder="Contoh: Diskon Kemerdekaan" {...register("title")} />
                    {errors.title && <p className="text-sm font-medium text-destructive">{errors.title.message}</p>}
                </div>

                <div>
                    <Label htmlFor="code">Kode Promo</Label>
                    <Input id="code" placeholder="Contoh: MERDEKA20" {...register("code")} />
                    {errors.code && <p className="text-sm font-medium text-destructive">{errors.code.message}</p>}
                </div>

                <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" placeholder="Jelaskan detail dan syarat promo di sini..." {...register("description")} />
                    {errors.description && <p className="text-sm font-medium text-destructive">{errors.description.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <Label>Tipe Diskon</Label>
                    <Controller
                        control={control}
                        name="discountType"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe diskon" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percent">Persentase (%)</SelectItem>
                                    <SelectItem value="amount">Nominal (Rp)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.discountType && <p className="text-sm font-medium text-destructive">{errors.discountType.message}</p>}
                </div>

                <div>
                    <Label htmlFor="discountValue">Nilai Diskon</Label>
                    <Input
                        id="discountValue"
                        type="number"
                        placeholder={watch("discountType") === "percent" ? "20" : "10000"}
                        {...register("discountValue")}
                    />
                    {errors.discountValue && <p className="text-sm font-medium text-destructive">{errors.discountValue.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <Input id="startDate" type="date" {...register("startDate")} />
                    {errors.startDate && <p className="text-sm font-medium text-destructive">{errors.startDate.message}</p>}
                </div>
                <div>
                    <Label htmlFor="endDate">Tanggal Berakhir</Label>
                    <Input id="endDate" type="date" {...register("endDate")} />
                    {errors.endDate && <p className="text-sm font-medium text-destructive">{errors.endDate.message}</p>}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Label htmlFor="isActive">Aktif</Label>
                {/* <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                        <Switch
                            id="isActive"
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                /> */}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
                <Button type="submit" disabled={isPending}>{promo ? "Simpan Perubahan" : "Buat Promo"}</Button>
            </div>
        </form>
    );
}