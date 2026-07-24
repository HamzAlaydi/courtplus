import React, { useState } from "react";
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
  fieldName,
  maxFiles = 1,
  onFileChange,
}) => {
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  console.log(fileList);

  const onChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList && newFileList[0]) {
      onFileChange(fieldName, newFileList[0]);
    } else {
      onFileChange(fieldName, null);
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
    // onSuccess("ok");
    onFileChange(fileList, { onSuccess, onError });
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
