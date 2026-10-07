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
  Tag,
  Tooltip,
  Modal, Alert } from "antd";
import "dayjs/locale/en";
import WorkingHours from "../components/WorkingHours"; // Reusable component
import { UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranches } from "../actions/branch_action";
import { useNotification } from "../modules/NotificationProvider";
import {
  IoIosCloseCircleOutline,
  IoMdInformationCircleOutline,
} from "react-icons/io";
import GooglePlacesInput from "../components/GooglePlaceses";
import { useNavigate, useParams } from "react-router-dom";
import { getCourtAvailability } from "../actions/subscription_action";
import {
  createCourt,
  deleteCourt,
  getCourt,
  resubmitCourt,
  updateCourt,
} from "../actions/court_actions";
import ModalDelete from "../components/ModalDelete";
import { MdDeleteOutline } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { uploadImageToS3 } from "../utils/functions";
import UploadProgress from "../components/UploadProgress";
import { notifyError } from "../utils/errorMessages";

// 16:9. Court photos are shown in fixed-ratio cards in the mobile app and on
// the website, so a consistent crop is what keeps listings looking uniform.
const COURT_IMAGE_ASPECT = 16 / 9;
const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 100;

const { TextArea } = Input;

// Same colors as CourtCard for courts in a moderation state
const MODERATION_STATUS_COLORS = {
  pending_payment: "orange",
  pending_approval: "blue",
  changes_requested: "red",
  suspended: "default",
};

const formatMoney = (cents, currency) =>
  `${((cents ?? 0) / 100).toLocaleString()} ${(currency || "").toUpperCase()}`;

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
  // Court data waiting for the vendor to confirm a paid add-on.
  const [pendingCreate, setPendingCreate] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [images, setImages] = useState([]); // Store image URLs
  const [imageIds, setImageIds] = useState([]); // Store uploaded image IDs
  const [video, setVideo] = useState(null); // Store uploaded video URL
  const [videoId, setVideoId] = useState(null); // Store uploaded video ID
  const [placeId, setPlaceId] = useState();
  const [place, setPlace] = useState(); // full selection: { name, address, lat, lng }
  const [courtStatus, setCourtStatus] = useState(true); // Default value

  // Courts in a moderation state: the available/unavailable toggle is hidden
  // and their status is shown as a Tag instead
  const isModerationStatus = Object.keys(MODERATION_STATUS_COLORS).includes(
    court?.status
  );

  // 🔹 Fetch branches with applied filters
  const { isLoading, data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches({ page: 1, pageSize: 100 }),
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
        isAirConditioned: !!court.isAirConditioned,
        isWomenOnly: !!court.isWomenOnly,
        zone: court.schedule?.timeZone || "Asia/Riyadh",
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
    onSuccess: (created) => {
      queryClient.invalidateQueries(["all-courts"]);
      // New courts go live only after payment + ops approval
      if (created?.status === "pending_payment") {
        notify("success", t("billing.court_pending_payment"));
        navigate("/billing");
        return;
      }
      navigate("/courts");
      notify("success", "Court created successfully.");
    },
    onError: (err) => {
      console.log("Error creating court:", err);
      notifyError(notify, err, t);
    },
  });

  const { mutate: updateCourtMutate } = useMutation({
    mutationFn: (data) => updateCourt(id, data),
    onSuccess: async () => {
      queryClient.invalidateQueries(["all-courts"]);
      queryClient.invalidateQueries(["court", id]);

      // Courts with requested changes go back to the ops queue only AFTER
      // a successful edit — never resubmit on a failed update.
      if (court?.status === "changes_requested") {
        try {
          await resubmitCourt(id);
          notify("success", t("courtForm.resubmit_success"));
        } catch (err) {
          notifyError(notify, err, t, "courtForm.resubmit_failed");
        }
        navigate("/courts");
        return;
      }

      navigate(`/courts/${id}`);
      notify("success", "Court updated successfully.");
    },
    onError: (err) => {
      console.log("Error updating court:", err);
      notifyError(notify, err, t, "courtForm.update_failed");
    },
  });

  // What one more court costs, fetched only when creating. Lets the vendor
  // confirm a paid add-on BEFORE the card is charged — until now the first
  // they heard of the charge was the invoice.
  const { data: courtAvailability } = useQuery({
    queryKey: ["court-availability"],
    queryFn: getCourtAvailability,
    enabled: !id,
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
      // Courts in a moderation state keep it — never stomp with available/unavailable
      ...(isModerationStatus
        ? {}
        : { status: courtStatus ? "available" : "unavailable" }),
    };

    if (id) {
      // ✅ EDIT EXISTING COURT
      updateCourtMutate(finalData);
    } else {
      // ✅ CREATE NEW COURT
      if (courtAvailability?.canCreate === false) {
        notify("error", t("billing.court_creation_blocked"));
        navigate("/billing");
        return;
      }
      if (courtAvailability?.nextCourtChargeCents > 0) {
        // Paid add-on: confirm the price first.
        setPendingCreate(finalData);
        return;
      }
      createCourtMutate(finalData);
    }
  };

  // null = idle, 0-100 = in flight. Keyed by kind so an image and a video can
  // upload independently without one clobbering the other's indicator.
  const [uploading, setUploading] = useState({ image: null, video: null });

  // Accept on EITHER the reported MIME or the file extension.
  //
  // Browsers do not always produce a MIME for media files — .mov in
  // particular often arrives as an empty string, and uploadImageToS3 already
  // works around the same thing when signing the S3 policy. Checking the MIME
  // alone silently rejected perfectly valid videos, so a vendor picked a file
  // and simply nothing happened.
  const matchesFile = (file, mimes, extensions) => {
    const type = (file.type || "").toLowerCase();
    if (type && mimes.includes(type)) return true;
    const name = (file.name || "").toLowerCase();
    return extensions.some((ext) => name.endsWith(ext));
  };

  const validateImage = (file) => {
    const okType = matchesFile(
      file,
      ["image/png", "image/jpeg", "image/webp"],
      [".png", ".jpg", ".jpeg", ".webp"]
    );
    if (!okType) {
      notify("error", t("courtForm.image_type_error"));
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > MAX_IMAGE_MB) {
      notify("error", t("courtForm.image_size_error", { mb: MAX_IMAGE_MB }));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const validateVideo = (file) => {
    const okType = matchesFile(
      file,
      ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
      [".mp4", ".mov", ".m4v", ".webm"]
    );
    if (!okType) {
      notify("error", t("courtForm.video_type_error"));
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > MAX_VIDEO_MB) {
      notify("error", t("courtForm.video_size_error", { mb: MAX_VIDEO_MB }));
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handleUpload = async (
    { file, onSuccess, onError },
    isVideo = false
  ) => {
    const kind = isVideo ? "video" : "image";
    setUploading((prev) => ({ ...prev, [kind]: 0 }));
    try {
      const { assetId, assetUrl } = await uploadImageToS3(
        file,
        isVideo ? "court_video" : "court_image",
        (percent) => setUploading((prev) => ({ ...prev, [kind]: percent }))
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
      // S3 rejects a policy violation (usually size) with a bare 403, which as
      // a plain "upload failed" told the vendor nothing about what to change.
      const isPolicyRejection = /\b(403|400)\b/.test(String(err?.message));
      notify(
        "error",
        isPolicyRejection
          ? t(isVideo ? "courtForm.video_size_error" : "courtForm.image_size_error", {
              mb: isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB,
            })
          : t(isVideo ? "courtForm.video_upload_failed" : "courtForm.image_upload_failed")
      );
      onError?.(err);
    } finally {
      setUploading((prev) => ({ ...prev, [kind]: null }));
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
      <Modal
        open={!!pendingCreate}
        title={t("billing.court_addon_confirm_title")}
        okText={t("common.yes")}
        cancelText={t("common.cancel")}
        onOk={() => {
          const data = pendingCreate;
          setPendingCreate(null);
          createCourtMutate(data);
        }}
        onCancel={() => setPendingCreate(null)}
      >
        {t(
          courtAvailability?.chargedNow
            ? "billing.court_addon_confirm"
            : "billing.court_addon_pending_sub",
          {
            amount: formatMoney(
              courtAvailability?.nextCourtChargeCents,
              courtAvailability?.currency
            ),
          }
        )}
      </Modal>
      {/* Ops decision + reason: the notification links here, but the page
          showed neither the status nor why changes were requested. */}
      {court?.status && ["changes_requested", "suspended", "pending_approval", "pending_payment"].includes(court.status) && (
        <Alert
          type={["changes_requested", "suspended"].includes(court.status) ? "warning" : "info"}
          showIcon
          style={{ marginBottom: 16 }}
          message={t(`courtCard.status.${court.status}`, court.status)}
          description={court.rejectionReason ? `${t("courtCard.rejection_reason")}: ${court.rejectionReason}` : undefined}
        />
      )}
      <Form
        size="large"
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          zone: "Asia/Riyadh",
          isAirConditioned: false,
          isWomenOnly: false,
        }}
      >
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
            <Form.Item
              name="isAirConditioned"
              label={t("courtForm.air_conditioned")}
              valuePropName="checked"
            >
              <Switch
                className="toggle-switch"
                checkedChildren={t("courtForm.air_conditioned_yes")}
                unCheckedChildren={t("courtForm.air_conditioned_no")}
              />
            </Form.Item>
            <Form.Item
              name="isWomenOnly"
              label={t("courtForm.women_only")}
              valuePropName="checked"
            >
              <Switch
                className="toggle-switch"
                checkedChildren={t("courtForm.women_only_yes")}
                unCheckedChildren={t("courtForm.women_only_no")}
              />
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
              {isModerationStatus ? (
                <div className="form-row">
                  <Tag color={MODERATION_STATUS_COLORS[court?.status]}>
                    {t(`courtCard.status.${court?.status}`, court?.status)}
                  </Tag>
                </div>
              ) : (
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
              )}
            </Form.Item>
          </div>
        </div>

        <div className="court-visuals">
          <h4 className="form-title">{t("courtForm.visuals")}</h4>

          {/* 🔹 Image Upload — cropped to a fixed ratio before it is sent.
               Court photos are rendered in fixed-ratio cards in the mobile app
               and on the website; accepting arbitrary dimensions meant the
               vendor picked the framing by accident and every listing looked
               different. Cropping here makes the vendor choose the part of the
               photo that matters. */}
          <Form.Item
            label={t("courtForm.upload_image")}
            extra={t("courtForm.image_hint")}
          >
            <ImgCrop
              aspect={COURT_IMAGE_ASPECT}
              quality={0.9}
              modalTitle={t("courtForm.crop_title")}
              modalOk={t("courtForm.crop_confirm")}
              modalCancel={t("common.cancel")}
              showGrid
              showReset
              rotationSlider
            >
              <Upload
                disabled={uploading.image !== null}
                customRequest={(file) => handleUpload(file, false)}
                showUploadList={false}
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="court-dropzone-upload"
                beforeUpload={validateImage}
              >
                <div
                  className={`court-dropzone${
                    uploading.image !== null ? " court-dropzone--busy" : ""
                  }`}
                >
                  {uploading.image !== null ? (
                    <UploadProgress
                      percent={uploading.image}
                      label={t("courtForm.uploading_image")}
                    />
                  ) : (
                    <>
                      <UploadOutlined className="court-dropzone__icon" />
                      <span className="court-dropzone__title">
                        {t("courtForm.upload_image_btn")}
                      </span>
                      <span className="court-dropzone__hint">
                        {t("courtForm.image_formats")}
                      </span>
                    </>
                  )}
                </div>
              </Upload>
            </ImgCrop>
          </Form.Item>

          {/* 🔹 Uploaded Images Preview */}
          {images.length > 0 && (
            <div className="image-gallery">
              {images.map((img, index) => (
                <div className="img-container" key={img.id || index}>
                  <img
                    src={img.url}
                    alt={`court-${index}`}
                    className="preview-image"
                  />
                  <button
                    type="button"
                    className="remove-icon"
                    aria-label={t("common.delete")}
                    onClick={() => handleRemove(img.id, false)}
                  >
                    <IoIosCloseCircleOutline color="#fff" size={22} />
                  </button>
                  {index === 0 && (
                    <span className="cover-badge">
                      {t("courtForm.cover_image")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 🔹 Video Upload */}
          <Form.Item
            label={t("courtForm.upload_video")}
            extra={t("courtForm.video_hint")}
          >
            <Upload
              disabled={!!video || uploading.video !== null}
              customRequest={(file) => handleUpload(file, true)}
              showUploadList={false}
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"
              className="court-dropzone-upload"
              beforeUpload={validateVideo}
            >
              <div
                className={`court-dropzone${
                  video ? " court-dropzone--disabled" : ""
                }${uploading.video !== null ? " court-dropzone--busy" : ""}`}
              >
                {uploading.video !== null ? (
                  <UploadProgress
                    percent={uploading.video}
                    label={t("courtForm.uploading_video")}
                  />
                ) : (
                  <>
                    <UploadOutlined className="court-dropzone__icon" />
                    <span className="court-dropzone__title">
                      {t("courtForm.upload_video_btn")}
                    </span>
                    <span className="court-dropzone__hint">
                      {t("courtForm.video_formats")}
                    </span>
                  </>
                )}
              </div>
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
