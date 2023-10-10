
<script lang="ts">
    import {enhance} from '$app/forms';
    import Dropzone from "svelte-file-dropzone/Dropzone.svelte";
    import {BlockBlobClient} from "@azure/storage-blob";
    import JSZip from "jszip";

    let blobUrl = '';
    let zipFileBlob: Blob = new Blob();
    let zipFile: File;
    let uploadedLength = 0;
    let uploadingStarted = false;

    $: uploadProgress = zipFileBlob.size > 0 ? (uploadedLength / zipFileBlob?.size) * 100 : 0;

    const onProgress = (progress) => {
        uploadedLength = progress.loadedBytes;
    };


    const handleFilesSelect = (e: CustomEvent) => {
        const { acceptedFiles } = e.detail;

        const zip = new JSZip();
        acceptedFiles.forEach((file : File) => {
            zip.file(file.name, file);
        });
        zip.generateAsync({ type: 'blob' }).then((content) => {
            zipFileBlob = content;
        });
        const input = document.querySelector('input[name="SelectedFiles"]');
        const currentMillis = new Date().getMilliseconds()
        zipFile = new File([zipFileBlob], `zipFile-${currentMillis}.zip`, { type: 'application/zip' });
        if (input) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(zipFile);
            input.files = dataTransfer.files;
        }
    };

    const uploadFile = async (sasUrl: string) => {
        uploadingStarted = true;
        const blockBlobClient = new BlockBlobClient(sasUrl);
        const promises = [];
        promises.push(blockBlobClient.uploadData(zipFileBlob, {
            blobHTTPHeaders: {
                blobContentType: 'application/zip'
            },
            onProgress: onProgress
        }));
        await Promise.all(promises);

        return {
            success: true,
            blobUrl: blobUrl
        };
    };
</script>

<section class="section">

    <div class="container">
        <div class="columns is-centered">

            <div class="column is-half">
                <h1 class="title">File Uploading Test</h1>
                <Dropzone multiple={true} on:drop={handleFilesSelect} />
                <form
                    method="POST"
                    action="?/getBlobSasUrl"
                    use:enhance={() => {
                    return async ({ result, update }) => {
                        await update();
                        const sasUrl = result.data.sasUrl;
                        blobUrl = result.data.blobUrl;
                        await uploadFile(sasUrl)};}}>
                    <div class="field">
                        <div class="control">
                            <input name="SelectedFiles" class="input" type="file">
                        </div>
                    </div>
                    <div class="field">
                        <div class="control">
                            <input name="Submit" class="input" type="submit" placeholder="Submit">
                        </div>
                    </div>
                </form>
                <br />
                <progress class="progress is-success" value={uploadProgress} max="100">{uploadProgress}%</progress>
                {#if uploadingStarted}
                    <h3 class="title is-4 has-text-centered">{uploadProgress.toFixed(0)}% uploaded of {zipFile.name}</h3>
                {/if}
            </div>
        </div>
    </div>
</section>