import React, { useState, useEffect } from "react";
import { Upload, Image } from "antd";
import ImgCrop from "antd-img-crop";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// Reusable FileUpload component
const ImageUploader = ({
  children,
  className,
  shape,
  initialUrl,
  maxFiles = 1,
  onFileChange,
}) => {
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // Seed existing image (edit mode) so its preview renders as a done item
  useEffect(() => {
    if (initialUrl) {
      setFileList((prev) =>
        prev.length
          ? prev
          : [{ uid: "-1", name: "image", status: "done", url: initialUrl }]
      );
    }
  }, [initialUrl]);

  const onChange = ({ fileList: newFileList }) => {
    // Point previews of freshly uploaded items at the real asset URL
    // (the parent passes the CloudFront assetUrl to onSuccess)
    const patchedList = newFileList.map((file) =>
      file.status === "done" && !file.url && typeof file.response === "string"
        ? { ...file, url: file.response }
        : file
    );
    setFileList(patchedList);
    if (!newFileList.length) {
      onFileChange(null, {});
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const customRequest = ({ file, onSuccess, onError }) => {
    onFileChange(file, { onSuccess, onError });
  };

  return (
    <div className={className}>
      <ImgCrop rotationSlider>
        <Upload
          listType={shape === "circle" ? "picture-circle" : "picture-card"}
          fileList={fileList}
          onChange={onChange}
          onPreview={handlePreview}
          maxCount={maxFiles}
          customRequest={customRequest}
          beforeUpload={() => {
            // Optionally, add validation before uploading, such as file type checks
            return true;
          }}
        >
          {fileList.length < maxFiles && (children || "+ Upload")}
        </Upload>
      </ImgCrop>
      {previewImage && (
        <Image
          wrapperStyle={{
            display: "none",
          }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(""),
          }}
          src={previewImage}
        />
      )}
    </div>
  );
};

export default ImageUploader;
