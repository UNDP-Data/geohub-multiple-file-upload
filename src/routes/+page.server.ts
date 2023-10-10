import {env} from "$env/dynamic/private";
import {type Actions, fail} from "@sveltejs/kit";
import { UPLOAD_BLOB_URL, UPLOAD_CONTAINER_NAME, UPLOAD_RAW_FOLDER_NAME} from "$lib/constants";
import {getSasUrl} from "$lib/helpers";

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

