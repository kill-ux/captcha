import crypto from "crypto"
import { readdir } from "fs/promises"
import { dirname, join, extname, basename } from "path"
import { fileURLToPath } from "url"
import { ChallengeType } from "../types/types"
import type { ChallengeGenerator, GeneratedChallenge } from "./types"
import { sha256, verifyHash } from "../utils/hash"

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_ROOT = join(__dirname, "..", "..", "res", "png_ready")

const GRID_SIZE = 9;
const TARGET_IMAGE_COUNT = 4;
const DISTRACTOR_IMAGE_COUNT = GRID_SIZE - TARGET_IMAGE_COUNT;

type ImageFile = {
    category: string;
    filename: string;
    path: string;
};

// type InternalImageChallenge = GeneratedChallenge & {
//     targetCategory: string;
//     correctImageIds: string[];
// };

async function listCategories(): Promise<string[]> {
    const entries = await readdir(IMAGES_ROOT, {
        withFileTypes: true,
    });

    const categories: string[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        categories.push(entry.name);
    }

    if (categories.length < 2) {
        throw new Error(
            "At least two image categories are required",
        );
    }

    return categories;
}

async function listImagesInCategory(
    category: string,
): Promise<ImageFile[]> {
    const categoryDirectory = join(
        IMAGES_ROOT,
        category,
    );

    const entries = await readdir(categoryDirectory, {
        withFileTypes: true,
    });

    return entries
        .filter(
            (entry) =>
                entry.isFile() &&
                extname(entry.name).toLowerCase() === ".png",
        )
        .map((entry) => ({
            category,
            filename: entry.name,
            path: join(
                "png_ready",
                category,
                entry.name,
            ),
        }));
}

function randomItem<T>(items: T[]): T {
    if (items.length === 0) {
        throw new Error("Cannot choose from an empty array");
    }

    return items[
        Math.floor(Math.random() * items.length)
    ]!;
}


function randomItems<T>(
    items: T[],
    count: number,
): T[] {
    if (items.length < count) {
        throw new Error(
            `Need ${count} items, but only found ${items.length}`,
        );
    }

    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(
            Math.random() * (index + 1),
        );

        [copy[index], copy[randomIndex]] = [
            copy[randomIndex]!,
            copy[index]!,
        ];
    }

    return copy.slice(0, count);
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(
            Math.random() * (index + 1),
        );

        [copy[index], copy[randomIndex]] = [
            copy[randomIndex]!,
            copy[index]!,
        ];
    }

    return copy;
}


// function imageId(
//     category: string,
//     filename: string,
// ): string {
//     return `${category}/${filename}`;
// }


function answerFor(
    selectedIds: string[],
): string {
    return [...selectedIds].sort().join(",");
}


export const imageSelectionChallenge: ChallengeGenerator = {
    type: ChallengeType.ImageSelection,

    async generate(): Promise<GeneratedChallenge> {
        const categories = await listCategories()
        const targetCategory = randomItem(categories)
        const targetImages = await listImagesInCategory(targetCategory)
        const distractorCategories = categories.filter(category => category != targetCategory)
        const distractorImages: ImageFile[] = []
        for (let index = 0; index < DISTRACTOR_IMAGE_COUNT; index++) {
            const category = randomItem(distractorCategories)
            const images = await listImagesInCategory(category)
            distractorImages.push(randomItem(images))
        }

        const selectedTargetImages = randomItems(targetImages, TARGET_IMAGE_COUNT)
        const allImages = [...selectedTargetImages, ...distractorImages]

        const generatedImages = allImages.map(image => ({
            id: crypto.randomUUID(),
            path: image.path,
            isCorrect: image.category === targetCategory,
        }))


        const correctImageIds = generatedImages
            .filter((image) => image.isCorrect)
            .map((image) => image.id);

        const shuffledImages = shuffle(generatedImages);

        return {
            images: shuffledImages,
            answerHash: sha256(answerFor(correctImageIds)),
            prompt: `Select all images with ${targetCategory}`
        }
    },

    verify(answer: string[], challenge): boolean {
        return verifyHash(answerFor(answer), challenge.answerHash)
    }
}