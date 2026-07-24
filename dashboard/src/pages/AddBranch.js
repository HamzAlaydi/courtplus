import {
  Button,
  Form,
  Input,
  Radio,
  Spin,
  Switch,
  Tooltip,
  Upload,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ImgCrop from "antd-img-crop";
import { IoImageOutline } from "react-icons/io5";
import { useNotification } from "../modules/NotificationProvider";
import ImageUploader from "../components/ImageUploader";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { IoMdInformationCircleOutline } from "react-icons/io";
// import GooglePlacesInput from "../components/GooglePlaceses";
import {
  createBranch,
  deleteBranch,
  getBranch,
  getBranches,
  updateBranch,
} from "../actions/branch_action";
import { useNavigate, useParams } from "react-router-dom";
import WorkingHours from "../components/WorkingHours";
import { useQuery } from "@tanstack/react-query";
import { MdDeleteOutline } from "react-icons/md";
import ModalDelete from "../components/ModalDelete";
import { uploadImageToS3 } from "../utils/functions";
import LocationSelector from "../components/LocationSelector";

export default function AddBranch() {
  const { t } = useTranslation();
  const notify = useNotification();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { id } = useParams(); // 🔹 Get `id` from URL

  const { refetch: refetchBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
    keepPreviousData: true,
    enabled: false,
  });

  // 🔹 Fetch branch data using `useQuery`
  const {
    data: branch,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["branch", id], // 🔹 Unique query key
    queryFn: () => getBranch(id), // 🔹 API call
    enabled: !!id, // 🔹 Only run query if `id` exists
  });

  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [coverImageId, setCoverImageId] = useState(null);
  const [logoImageUrl, setLogoImageUrl] = useState(null);
  const [logoImageId, setLogoImageId] = useState(null);
  const [placeId, setPlaceId] = useState();
  const [isCourtVisible, setIsCourtVisible] = useState(true); // Default value
  const [availabilities, setAvailabilities] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (branch) {
      // ✅ Seed location in the exact shape the submit handler consumes
      // (same as LocationSelector's onChange output)
      const rawCoords = branch.location?.coordinates;
      const coordinates = rawCoords?.coordinates
        ? { lat: rawCoords.coordinates[1], lng: rawCoords.coordinates[0] } // GeoJSON [lng, lat]
        : rawCoords || null;

      form.setFieldsValue({
        name: branch.name || "",
        status: branch.status || "open",
        phoneNumber: branch.phoneNumber || "",
        zone: branch.schedule?.timeZone || "UTC",
        location: branch.location
          ? {
              coordinates,
              address: branch.location.address || "",
              name: branch.location.name || "",
            }
          : undefined,
      });
      setPlaceId(branch.location?.placeId || "");
      setIsCourtVisible(branch.isVisible);
      setCoverImageUrl(branch.coverUrl || null);
      setCoverImageId(branch.coverAssetId || null);
      setAvailabilities(branch.schedule?.availabilities || []);
      setLogoImageUrl(branch.logoUrl || null);
    }
  }, [branch, form]);

  const handleUploadCover = async (info) => {
    const file = info?.file?.originFileObj || info?.file;
    if (!(file instanceof Blob)) return;

    try {
      const { assetId, assetUrl } = await uploadImageToS3(file, "branch_cover");
      setCoverImageId(assetId);
      setCoverImageUrl(assetUrl);
      notify("success", t("branchForm.notifications.cover_uploaded"));
    } catch (err) {
      console.log(err);
      notify("error", t("branchForm.notifications.upload_failed"));
    }
  };

  const handleUploadLogo = async (file, callbackOptions = {}) => {
    const { onSuccess, onError } = callbackOptions || {};
    if (!file) return;

    try {
      const { assetId, assetUrl } = await uploadImageToS3(file, "branch_logo");
      setLogoImageId(assetId);
      setLogoImageUrl(assetUrl);
      onSuccess?.(assetUrl);
      notify("success", t("branchForm.notifications.logo_uploaded"));
    } catch (err) {
      console.error("Upload failed:", err);
      onError?.(err);
      notify("error", t("branchForm.notifications.upload_failed"));
    }
  };

  const handleSubmit = (values) => {
    // Step 1: Filter out only enabled days and format time

    // ✅ Format `availabilities` correctly (Remove unnecessary fields)
    const formattedAvailabilities = availabilities.map((availability) => ({
      days: availability.days, // ✅ Keep only days
      startTime: availability.startTime?.slice(0, 5), // ✅ Ensure "HH:mm" format
      endTime: availability.endTime?.slice(0, 5), // ✅ Ensure "HH:mm" format
    }));

    const { zone, location, ...filteredValues } = values;
    // Extract coordinates from LocationSelector output
    const coordinates = location?.coordinates || null;
    const address = values.location.address;

    const formData = {
      ...filteredValues,
      isVisible: isCourtVisible,
      placeId: placeId,
      phoneNumber: values.phoneNumber,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng,
      },
      address: address,

      schedule: {
        timeZone: zone,
        availabilities: formattedAvailabilities,
      },
    };

    if (coverImageId) {
      formData.coverAssetId = coverImageId;
    }
    if (logoImageId) {
      formData.logoAssetId = logoImageId;
    }

    if (id) {
      updateBranch(id, formData)
        .then(() => {
          refetch();
          refetchBranches();
          navigate(`/branches/${id}`);
          notify("success", t("branchForm.notifications.updated"));
        })
        .catch((err) => {
          console.log(err);
          notify(
            "error",
            err?.response?.data?.code ||
              err?.response?.data?.message ||
              t("branchForm.notifications.update_failed")
          );
        });
    } else {
      createBranch(formData)
        .then(() => {
          refetchBranches();
          navigate("/branches");
          notify("success", t("branchForm.notifications.created"));
        })
        .catch((err) => {
          console.log(err);
          notify(
            "error",
            err?.response?.data?.code ||
              err?.response?.data?.message ||
              t("branchForm.notifications.create_failed")
          );
        });
    }
  };

  const handleConfirm = () => {
    setIsModalVisible(false);
    deleteBranch(id).then(() => {
      refetchBranches();
      navigate("/branches");
      notify("success", "Branch is deleted successfully");
    });
  };

  return (
    <Spin spinning={isLoading}>
      <div className="content">
        <div className="content-header">
          <h4>{id ? t("branchForm.edit") : t("branchForm.add")}</h4>
          {id && (
            <Button
              onClick={() => setIsModalVisible(true)}
              danger
              type="primary"
            >
              <MdDeleteOutline size={22} /> {t("branchForm.btn_delete")}
            </Button>
          )}
        </div>
        <div className="addbranch">
          {/* Header Image Upload */}
          <div className="cover-container">
            <ImgCrop aspect={4 / 1} cropShape="rect" modalWidth={400}>
              <Upload
                showUploadList={false}
                beforeUpload={() => false} // Prevent automatic upload
                onChange={handleUploadCover}
              >
                <div
                  className="cover"
                  style={{
                    background: coverImageUrl
                      ? `url("${coverImageUrl}") center/cover no-repeat`
                      : "linear-gradient(to right, #b3e5fc, #d4fc79)",
                  }}
                >
                  {!coverImageUrl && (
                    <div>
                      <IoImageOutline size={28} />
                      <h5>{t("branchForm.upload_cover")}</h5>
                    </div>
                  )}
                  <div className="cover-overlay">
                    <IoImageOutline size={28} />
                    <h5>{t("branchForm.upload_cover")}</h5>
                  </div>
                </div>
              </Upload>
            </ImgCrop>

            {/* Logo Upload */}
            <ImageUploader
              initialUrl={logoImageUrl}
              onFileChange={handleUploadLogo}
              className="logo"
              shape="circle"
            >
              {logoImageUrl ? (
                <img src={logoImageUrl} alt="Logo" className="img-circle" />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <IoImageOutline size={28} />
                  <p style={{ fontSize: "12px", margin: 0 }}>
                    {t("branchForm.upload_logo")}
                  </p>
                </div>
              )}
            </ImageUploader>
          </div>

          <Form
            form={form}
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <div className="addbranch-form">
              <div className="addbranch-form-left">
                <Form.Item
                  rules={[
                    { required: true, message: t("branchForm.name_required") },
                  ]}
                  label={t("branchForm.name")}
                  name="name"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="phoneNumber"
                  label={t("branchForm.phone_number")}
                  rules={[
                    {
                      validator: (_, value) =>
                        !value || isValidPhoneNumber(value)
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error(t("branchForm.phone_invalid"))
                            ),
                    },
                  ]}
                >
                  <PhoneInput defaultCountry="EG" />
                </Form.Item>

                <Form.Item
                  label="Location"
                  required
                  name="location"
                  rules={[{ required: true, message: "Location is required" }]}
                >
                  <LocationSelector
                    apiKey="AIzaSyBA82Tqljmxcixjt3dkrSMxYWHCF8Vxt9E"
                    initialPlaceName={branch?.location?.name}
                    initialCoordinates={branch?.location?.coordinates} // GeoJSON
                    initialAddress={branch?.location?.address}
                    onChange={(loc) => {
                      form.setFieldValue("location", loc);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  rules={[{ required: true, message: "Status is required" }]}
                  name="status"
                  label={t("branchForm.status")}
                >
                  <Radio.Group className="custom-radio-group">
                    <Radio.Button value="open">
                      {t("branchForm.status_open")}
                    </Radio.Button>
                    <Radio.Button value="closed">
                      {t("branchForm.status_closed")}
                    </Radio.Button>
                    <Radio.Button value="occupied">
                      {t("branchForm.status_occupied")}
                    </Radio.Button>
                    <Radio.Button value="maintenance">
                      {t("branchForm.status_maintenance")}
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  label={t("branchForm.show_to_users")}
                  layout="horizontal"
                >
                  <div className="form-row">
                    <Switch
                      className="toggle-switch"
                      checked={isCourtVisible}
                      onChange={(checked) => {
                        setIsCourtVisible(checked);
                      }}
                    />
                    <Tooltip title={t("branchForm.visibility_tooltip")}>
                      <IoMdInformationCircleOutline color="#777" size={26} />
                    </Tooltip>
                  </div>
                </Form.Item>
              </div>
              <div>
                <WorkingHours
                  title={t("branchForm.working_hours")}
                  initialSchedule={branch?.schedule}
                  onChange={setAvailabilities}
                />
              </div>
            </div>
            <div className="submit-btns">
              <Button
                htmlType="submit"
                className="btn-submit"
                style={{ marginRight: "2rem" }}
                type="primary"
              >
                {t("branchForm.submit")}
              </Button>
              <Button
                onClick={() => {
                  navigate(-1);
                  form.resetFields();
                }}
              >
                {t("branchForm.cancel")}
              </Button>
            </div>
          </Form>
        </div>
        <ModalDelete
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onConfirm={handleConfirm}
          customText={{
            title: t("branchForm.delete_modal.title"),
            description: t("branchForm.delete_modal.description"),
            warning: t("branchForm.delete_modal.warning"),
            afterWarning: t("branchForm.delete_modal.after_warning"),
            confirmText: t("branchForm.delete_modal.confirm_text"),
          }}
        />
      </div>
    </Spin>
  );
}
