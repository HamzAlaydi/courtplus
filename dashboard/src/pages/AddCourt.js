import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Spin,
  InputNumber,
  Switch,
  Tooltip,
} from "antd";
import "dayjs/locale/en";
import WorkingHours from "../components/WorkingHours"; // Reusable component
import { UploadOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranches } from "../actions/branch_action";
import { useNotification } from "../modules/NotificationProvider";
import {
  IoIosCloseCircleOutline,
  IoMdInformationCircleOutline,
} from "react-icons/io";
import GooglePlacesInput from "../components/GooglePlaceses";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCourt,
  deleteCourt,
  getCourt,
  updateCourt,
} from "../actions/court_actions";
import ModalDelete from "../components/ModalDelete";
import { MdDeleteOutline } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { uploadImageToS3 } from "../utils/functions";

const { TextArea } = Input;

export default function CourtForm() {
  const { t } = useTranslation();
  const { id } = useParams(); // Get the court ID from the URL
  const [form] = Form.useForm();
  const notify = useNotification();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔹 Fetch court data when editing
  const { data: court, isLoading: isCourtLoading } = useQuery({
    queryKey: ["court", id], // 🔹 Unique query key
    queryFn: () => getCourt(id), // 🔹 API call
    enabled: !!id, // 🔹 Only run query if `id` exists
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);
  const [images, setImages] = useState([]); // Store image URLs
  const [imageIds, setImageIds] = useState([]); // Store uploaded image IDs
  const [video, setVideo] = useState(null); // Store uploaded video URL
  const [videoId, setVideoId] = useState(null); // Store uploaded video ID
  const [placeId, setPlaceId] = useState();
  const [place, setPlace] = useState(); // full selection: { name, address, lat, lng }
  const [courtStatus, setCourtStatus] = useState(true); // Default value

  // 🔹 Fetch branches with applied filters
  const { isLoading, data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    keepPreviousData: true,
  });

  // ✅ Populate Form Fields when court data is available
  useEffect(() => {
    if (court) {
      form.setFieldsValue({
        name: court.name || "",
        branchId: court.branchId || null,
        description: court.description || null,
        sport: court.sport || "tennis", // Add this line (use court.sport with a default fallback)
        size: court.size || "full",
        length: court.length || 0,
        width: court.width || 0,
        hourlyRate: court.hourlyRate || 0,
        surface: court.surface || "grass",
        zone: court.schedule?.timeZone || "UTC",
      });

      setAvailabilities(court.schedule?.availabilities || []);
      setCourtStatus(court.status === "available");

      // ✅ Seed location state (used as submit payload) from the court
      if (court.location) {
        setPlaceId(court.location.placeId || "");
        setPlace({
          name: court.location.name || "",
          address: court.location.address || "",
          lat: court.location.lat,
          lng: court.location.lng,
        });
      }

      if (court.assets?.length > 0) {
        const extractedImages = court.assets
          .filter((asset) => asset.type === "court_image")
          .map((img) => ({ id: img.id, url: img.url }));

        const extractedVideos = court.assets.find(
          (asset) => asset.type === "court_video"
        );

        setImages(extractedImages);
        setImageIds(extractedImages.map((img) => img.id));

        if (extractedVideos) {
          setVideo(extractedVideos.url);
          setVideoId(extractedVideos.id);
        }
      }
    }
  }, [court, form]);

  const { mutate: createCourtMutate } = useMutation({
    mutationFn: createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries(["all-courts"]);
      navigate("/courts");
      notify("success", "Court created successfully.");
    },
    onError: (err) => {
      console.log("Error creating court:", err);
      notify(
        "error",
        err?.response?.data?.code || "Something went wrong while creating."
      );
    },
  });

  const { mutate: updateCourtMutate } = useMutation({
    mutationFn: (data) => updateCourt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-courts"]);
      queryClient.invalidateQueries(["court", id]);
      navigate(`/courts/${id}`);
      notify("success", "Court updated successfully.");
    },
    onError: (err) => {
      console.log("Error updating court:", err);
      notify("error", "Something went wrong while updating. : ", err);
    },
  });

  const handleSubmit = (values) => {
    // ✅ Format `availabilities` correctly (Remove unnecessary fields)
    const formattedAvailabilities = availabilities.map((availability) => ({
      days: availability.days, // ✅ Keep only days
      startTime: availability.startTime?.slice(0, 5), // ✅ Ensure "HH:mm" format
      endTime: availability.endTime?.slice(0, 5), // ✅ Ensure "HH:mm" format
    }));

    const { zone, ...filteredValues } = values;

    const finalData = {
      ...filteredValues,
      images: imageIds,
      videoAssetId: videoId,
      schedule: {
        timeZone: zone,
        availabilities: formattedAvailabilities,
      },
      placeId,
      placeName: place?.name,
      address: place?.address,
      coordinates:
        place?.lat != null && place?.lng != null
          ? { lat: place.lat, lng: place.lng }
          : undefined,
      status: courtStatus ? "available" : "unavailable",
    };

    if (id) {
      // ✅ EDIT EXISTING COURT
      updateCourtMutate(finalData);
    } else {
      // ✅ CREATE NEW COURT

      createCourtMutate(finalData);
    }
  };

  const handleUpload = async (
    { file, onSuccess, onError },
    isVideo = false
  ) => {
    try {
      const { assetId, assetUrl } = await uploadImageToS3(
        file,
        isVideo ? "court_video" : "court_image"
      );

      if (isVideo) {
        setVideo(assetUrl);
        setVideoId(assetId);
      } else {
        setImages((prevImages) => [
          ...prevImages,
          { id: assetId, url: assetUrl },
        ]);
        setImageIds((prevIds) => [...prevIds, assetId]);
      }

      notify(
        "success",
        `${isVideo ? "Video" : "Image"} uploaded successfully!`
      );
      onSuccess?.(assetUrl);
    } catch (err) {
      console.log("Upload error:", err);
      notify("error", `${isVideo ? "Video" : "Image"} upload failed.`);
      onError?.(err);
    }
  };

  // ✅ Handle Removal (Image or Video)
  const handleRemove = (id, isVideo = false) => {
    if (isVideo) {
      setVideo(null);
      setVideoId(null);
      notify("success", "Video removed.");
    } else {
      setImages((prevImages) => prevImages.filter((img) => img.id !== id));
      setImageIds((prevIds) => prevIds.filter((imgId) => imgId !== id));
      notify("success", "Image removed.");
    }
  };

  const handleConfirm = () => {
    setIsModalVisible(false);
    deleteCourt(id).then(() => {
      queryClient.invalidateQueries(["all-courts"]);
      navigate("/courts");
      notify("success", "Court is deleted successfully");
    });
  };

  return (
    <Spin spinning={!!id && isCourtLoading}>
      <div className="court-form-container content">
      <div className="content-header">
        <h4>{id ? t("courtForm.title_edit") : t("courtForm.title_add")}</h4>
        {id && (
          <Button onClick={() => setIsModalVisible(true)} danger type="primary">
            <MdDeleteOutline size={22} /> {t("common.delete")}
          </Button>
        )}
      </div>
      <Form size="large" form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="form-section">
          <div className="form-group">
            <h4 className="form-title">{t("courtForm.basic_info")}</h4>

            <Form.Item
              name="name"
              label={t("courtForm.name")}
              rules={[{ required: true }]}
            >
              <Input placeholder={t("courtForm.placeholder_name")} />
            </Form.Item>
            <Form.Item name="description" label={t("courtForm.description")}>
              <TextArea
                rows={4}
                placeholder={t("courtForm.placeholder_description")}
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="branchId"
              label={t("courtForm.select_branch")}
              rules={[{ required: true }]}
            >
              <Select placeholder={t("courtForm.placeholder_branch")}>
                {isLoading ? (
                  <Spin size="small" />
                ) : (
                  branchData?.items?.map((branch) => (
                    <Select.Option key={branch.id} value={branch.id}>
                      {branch.name}
                    </Select.Option>
                  ))
                )}
              </Select>
            </Form.Item>

            <WorkingHours
              title={t("courtForm.operational_time")}
              initialSchedule={court?.schedule} // ✅ Pass the schedule object
              onChange={setAvailabilities}
            />
          </div>

          <div className="form-group">
            <h4 className="form-title">{t("courtForm.details")}</h4>

            <Form.Item
              rules={[{ required: true }]}
              name="sport"
              label={t("courtForm.sport")}
            >
              <Select placeholder="Select the court format">
                <Select.Option value="tennis">
                  {t("courtForm.tennis")}
                </Select.Option>
                <Select.Option value="football">
                  {t("courtForm.football")}
                </Select.Option>
                <Select.Option value="paddle">
                  {t("courtForm.paddle")}
                </Select.Option>
                <Select.Option value="volleyball">
                  {t("courtForm.volleyball")}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              rules={[{ required: true }]}
              name="size"
              label={t("courtForm.size")}
            >
              <Select placeholder="Select the court format">
                <Select.Option value="full">
                  {t("courtForm.size_full")}
                </Select.Option>
                <Select.Option value="half">
                  {t("courtForm.size_half")}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              rules={[{ required: true }]}
              name="length"
              label={t("courtForm.length")}
            >
              <InputNumber
                min={1}
                step={0.1}
                addonAfter={t("courtForm.unit_length")}
                placeholder={t("courtForm.placeholder_length")}
              />
            </Form.Item>
            <Form.Item
              rules={[{ required: true }]}
              name="width"
              label={t("courtForm.width")}
            >
              <InputNumber
                min={1}
                step={0.1}
                addonAfter={t("courtForm.unit_length")}
                placeholder={t("courtForm.placeholder_width")}
              />
            </Form.Item>

            <Form.Item
              rules={[{ required: true }]}
              name="hourlyRate"
              label={t("courtForm.hourlyRate")}
            >
              <InputNumber
                min={1}
                step={0.1}
                addonAfter={t("courtForm.unit_rate")}
              />
            </Form.Item>
            <Form.Item
              rules={[{ required: true }]}
              name="surface"
              label={t("courtForm.surface")}
            >
              <Select placeholder={t("courtForm.placeholder_surface")}>
                <Select.Option value="grass">
                  {t("courtForm.surface_grass")}
                </Select.Option>
                <Select.Option value="hard">
                  {t("courtForm.surface_hard")}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label={t("courtForm.place_name")}>
              <GooglePlacesInput
                initialName={court?.location?.name}
                initialPlaceId={court?.location?.placeId}
                onPlaceSelect={(selectedPlace) => {
                  setPlaceId(selectedPlace.placeId);
                  setPlace(selectedPlace);
                }}
              />
            </Form.Item>

            <Form.Item label={t("courtForm.status")}>
              <div className="form-row">
                <Switch
                  className="toggle-switch"
                  checked={courtStatus}
                  onChange={setCourtStatus}
                />
                <Tooltip title={t("courtForm.status_tooltip")}>
                  <IoMdInformationCircleOutline color="#777" size={26} />
                </Tooltip>
              </div>
            </Form.Item>
          </div>
        </div>

        <div className="court-visuals">
          <h4 className="form-title">{t("courtForm.visuals")}</h4>

          {/* 🔹 Image Upload */}
          <Form.Item label={t("courtForm.upload_image")}>
            <Upload
              customRequest={(file) => handleUpload(file, false)}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>
                {t("courtForm.upload_image_btn")}
              </Button>
            </Upload>
          </Form.Item>

          {/* 🔹 Uploaded Images Preview */}
          <div className="image-gallery">
            {images.map((img, index) => (
              <div className="img-container" key={img.id || index}>
                <img
                  src={img.url}
                  alt={`court-${index}`}
                  className="preview-image"
                />
                <IoIosCloseCircleOutline
                  color="#fff"
                  size={34}
                  className="remove-icon"
                  onClick={() => handleRemove(img.id, false)}
                />
              </div>
            ))}
          </div>

          {/* 🔹 Video Upload */}
          <Form.Item label={t("courtForm.upload_video")}>
            <Upload
              disabled={video ? true : false}
              customRequest={(file) => handleUpload(file, true)}
              showUploadList={false}
              accept="video/*"
            >
              <Button icon={<UploadOutlined />}>
                {t("courtForm.upload_video_btn")}
              </Button>
            </Upload>
          </Form.Item>
          {/* 🔹 Video Preview */}
          {video && (
            <div className="media-wrapper video-preview">
              <video src={video} controls className="preview-media" />

              <div
                className="remove-icon-video "
                onClick={() => handleRemove(null, true)}
              >
                X
              </div>
            </div>
          )}
        </div>

        {/* 🔹 Submit Button */}
        <div className="form-actions">
          <Button
            onClick={() => {
              navigate(-1);
              form.resetFields();
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button type="primary" htmlType="submit">
            {t("common.submit")}
          </Button>
        </div>
      </Form>
      <ModalDelete
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={handleConfirm}
        customText={{
          title: t("courtForm.delete_title"),
          description: t("courtForm.delete_description"),
          warning: t("courtForm.delete_warning"),
          afterWarning: t("courtForm.delete_after"),
          confirmText: t("courtForm.delete_confirm"),
        }}
      />
      </div>
    </Spin>
  );
}
