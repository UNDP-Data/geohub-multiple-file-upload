import {env} from "$env/dynamic/private";
import {BlobSASPermissions, BlobServiceClient, BlockBlobClient, StorageSharedKeyCredential} from "@azure/storage-blob";
import {UPLOAD_BASE_URL} from "$lib/constants";

export async function getSasUrl(containerName: string, fileName: string) {
    if (!env.AZURE_STORAGE_ACCOUNT_UPLOAD || !env.AZURE_STORAGE_ACCESS_KEY_UPLOAD) {
        throw Error('Azure Storage credentials not found');
    }

    const containerClient = getContainerClient(containerName);

    // save file in user email folder
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(
        fileName
    );

    return blockBlobClient.generateSasUrl({
        // allow user to write
        permissions: BlobSASPermissions.from({
            write: true
        }),

        // expired in an hour
        expiresOn: new Date(new Date().setHours(new Date().getHours() + 1))
    });
}


export function getContainerClient(containerName: string) {
    const blobServiceClient = getBlobServiceClient(
        env.AZURE_STORAGE_ACCOUNT_UPLOAD,
        env.AZURE_STORAGE_ACCESS_KEY_UPLOAD
    );
    return blobServiceClient.getContainerClient(containerName);
}

export const getBlobServiceClient = (azAccount: string, azAccountKey: string) => {
    const sharedKeyCredential = new StorageSharedKeyCredential(azAccount, azAccountKey);
    return new BlobServiceClient(
        UPLOAD_BASE_URL(azAccount),
        sharedKeyCredential
    );
};