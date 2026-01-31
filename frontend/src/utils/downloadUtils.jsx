export const downloadFile = (fileId) => {
    window.location.href = `/api/file/${fileId}/download`;
};