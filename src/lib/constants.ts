export const UPLOAD_RAW_FOLDER_NAME = 'zips';
export const UPLOAD_CONTAINER_NAME = 'test';

export const UPLOAD_BASE_URL = (account: string) => {
    return `https://${account}.blob.core.windows.net`;
};

export const UPLOAD_BLOB_URL = (account: string, fileName: string) => {
    const folder = `${UPLOAD_RAW_FOLDER_NAME}`;
    return `${UPLOAD_BASE_URL(account)}/${UPLOAD_CONTAINER_NAME}/${folder}/${fileName}`;
};
