import { z } from "zod";

// 定義種族選項
export const races = ["Human", "Elf", "Dwarf", "Orc"] as const;

// 定義職業選項
export const professions = ["Warrior", "Mage", "Rogue", "Healer"] as const;

// 定義屬性選項
export const attributeNames = {
    strength: "Strength",
    dexterity: "Dexterity",
    constitution: "Constitution",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma",
}

// 定義相簿照片資料結構
export const albumPhotoSchema = z.object({
    id: z.string(),
    key: z.string(), // S3 key
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.string(),
    objectUrl: z.string().optional(), // 本地預覽 URL
    uploading: z.boolean().optional(),
    progress: z.number().optional(),
    error: z.boolean().optional(),
});

// 定義角色資料結構和驗證規則
export const characterSchema = z.object({
    // 角色名稱
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(10, "Name must be less than 10 characters"),

    // 種族：需從定義的選項中選擇
    race: z.enum(races, {
        message: "Please select a race",
    }),

    // 職業：需從定義的選項中選擇
    profession: z.enum(professions, {
        message: "Please select a profession",
    }),

    // 屬性：每個屬性在 1 到 100 之間
    attributes: z.object({
        strength: z.number().min(1).max(100),
        dexterity: z.number().min(1).max(100),
        constitution: z.number().min(1).max(100),
        intelligence: z.number().min(1).max(100),
        wisdom: z.number().min(1).max(100),
        charisma: z.number().min(1).max(100),
    }),

    // 角色成長相簿
    album: z.array(albumPhotoSchema).max(20).optional(),
});

// TypeScript 型別 （自動從 Schema 生成）
export type Character = z.infer<typeof characterSchema>;
export type AlbumPhoto = z.infer<typeof albumPhotoSchema>;