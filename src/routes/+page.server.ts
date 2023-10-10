import {env} from "$env/dynamic/private";
import {type Actions, fail} from "@sveltejs/kit";
import {UPLOAD_BASE_URL, UPLOAD_BLOB_URL, UPLOAD_CONTAINER_NAME, UPLOAD_RAW_FOLDER_NAME} from "$lib/constants";
import type {BlockBlobClient} from "@azure/storage-blob";
import {BlobSASPermissions, BlobServiceClient, StorageSharedKeyCredential} from "@azure/storage-blob";

export const actions = {
    /**
     * An action to get SAS URL for data uploading
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getBlobSasUrl: async ({ request }) => {
        try {
            const file = (await request.formData()).get('SelectedFiles') as string;
            const fileName = file.name;
            // const now = new Date().toISOString().replace(/(\.\d{3})|[^\d]/g, '');
            // const names = fileName.split('.') as [string, string];

            // const newFileName = `${names[0]}_${now}.${names.slice(1).join('.')}`;
            const folder = `${UPLOAD_RAW_FOLDER_NAME}`;
            const sasUrl = await getSasUrl(UPLOAD_CONTAINER_NAME, folder + "/" + fileName);
            const blobUrl = UPLOAD_BLOB_URL(env.AZURE_STORAGE_ACCOUNT_UPLOAD, fileName);
            return { sasUrl, blobUrl };
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return fail(500, { status: error.status, message: 'error:' + error.message });
        }
    },
} satisfies Actions;

async function getSasUrl(containerName: string, fileName: string) {
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


function getContainerClient(containerName: string) {
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