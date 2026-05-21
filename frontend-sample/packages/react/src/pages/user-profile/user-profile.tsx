import "./user-profile.scss";
import React, { useState, useCallback, useEffect } from "react";

import notify from "devextreme/ui/notify";

import Toolbar, { Item } from "devextreme-react/toolbar";
import Button from "devextreme-react/button";
import ScrollView from "devextreme-react/scroll-view";
import { service } from "../../data/user-profile-service";
import { FormPhoto } from "../../components";
import {
  ProfileCard,
  ProfileCardItem,
} from "../../components/library/profile-card/ProfileCard";
import { withLoadPanel } from "../../utils/withLoadPanel";
import { useScreenSize } from "../../utils/media-query";
import { useAuth } from "../../contexts/auth";

import { ChangeProfilePasswordForm } from "../../components/library/change-profile-password-form/ChangeProfilePasswordForm";
import { formatPhone } from "../../utils/format-phone";
import { User } from "../../types/auth";

const copyToClipboard = (text) => (evt) => {
  window.navigator.clipboard?.writeText(text);
  const tipText = "Text copied";
  notify(
    {
      message: tipText,
      minWidth: `${tipText.length + 2}ch`,
      width: "auto",
      position: { of: evt.element, offset: "0 -30" },
    },
    "info",
    500
  );
};

type UserProfileContentProps = {
  basicInfoItems: ProfileCardItem[];
  contactItems: ProfileCardItem[];
  addressItems: ProfileCardItem[];
  profileData: User | undefined;
  handleDataChanged: (cardData: Partial<User>) => void;
  handleChangePasswordClick: () => void;
  handleContentScrolled: (boolean) => void;
};

const UserProfileContent = ({
  basicInfoItems,
  contactItems,
  addressItems,
  profileData,
  handleDataChanged,
  handleChangePasswordClick,
  handleContentScrolled,
}: UserProfileContentProps) => {
  const { isXSmall } = useScreenSize();

  const onScroll = useCallback(
    (reachedTop) => {
      handleContentScrolled(reachedTop);
    },
    [handleContentScrolled]
  );

  // Thêm handler cho thay đổi ảnh
  const handlePhotoChange = useCallback(
    (base64Image: string) => {
      handleDataChanged({
        image: base64Image,
        avatarUrl: base64Image, // Cập nhật cả 2 field
      });
    },
    [handleDataChanged]
  );

  return (
    <ScrollView className="view-wrapper-scroll" onScroll={onScroll}>
      <div className="cards-container">
        <ProfileCard
          wrapperCssClass="profile-card basic-info-card"
          title="Thông tin cơ bản "
          colCount={4}
          cardData={profileData || {}}
          items={basicInfoItems}
          onDataChanged={handleDataChanged}
        >
          <div className="basic-info-top-item profile-card-top-item">
            <FormPhoto
              link={profileData?.image || profileData?.avatarUrl || ""}
              editable
              size={80}
              onChange={handlePhotoChange} // Thêm callback này
            />
            <div>
              <div className="title-text">{profileData?.username}</div>
              <div className="subtitle-text with-clipboard-copy">
                <span>ID: {profileData?.id}</span>
                <Button
                  icon="copy"
                  className="copy-clipboard-button"
                  stylingMode="text"
                  onClick={copyToClipboard(profileData?.id)}
                  activeStateEnabled={false}
                  focusStateEnabled={false}
                  hoverStateEnabled={false}
                />
              </div>
              <Button
                text="Đổi mật khẩu"
                className="change-password-button"
                stylingMode="contained"
                icon={isXSmall ? void 0 : "lock"}
                onClick={handleChangePasswordClick}
              />
            </div>
          </div>
        </ProfileCard>

        {/* Các ProfileCard khác giữ nguyên */}
        <ProfileCard
          wrapperCssClass="profile-card contacts-card"
          title="Phương thức liên lạc"
          cardData={profileData || {}}
          items={contactItems}
          onDataChanged={handleDataChanged}
        >
          <div className="profile-card-top-item">
            <div className="image-wrapper">
              <i className="dx-icon dx-icon-mention" />
            </div>
            <div>
              <div className="title-text">
                {formatPhone(profileData?.phone ?? "")}
              </div>
              <div className="subtitle-text with-clipboard-copy">
                {profileData?.email}
                <Button
                  icon="copy"
                  className="copy-clipboard-button"
                  stylingMode="text"
                  onClick={copyToClipboard(profileData?.email)}
                  activeStateEnabled={false}
                  focusStateEnabled={false}
                  hoverStateEnabled={false}
                />
              </div>
            </div>
          </div>
        </ProfileCard>

        <ProfileCard
          wrapperCssClass="profile-card address-card"
          title="Địa chỉ"
          cardData={profileData || {}}
          items={addressItems}
          onDataChanged={handleDataChanged}
        >
          <div className="profile-card-top-item">
            <div className="image-wrapper">
              <i className="dx-icon dx-icon-map" />
            </div>
            <div>
              <div className="title-text">
                {profileData?.address}, {profileData?.city},{" "}
                {profileData?.country}
              </div>
            </div>
          </div>
        </ProfileCard>
      </div>
    </ScrollView>
  );
};
const UserProfileContentWithLoadPanel = withLoadPanel(UserProfileContent);

export const UserProfile = () => {
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<User | undefined>();
  const [savedProfileData, setSavedProfileData] = useState<User | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordPopupOpened, setIsChangedPasswordPopupOpened] =
    useState(false);
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [basicInfoItems, setBasicInfoItems] = useState<ProfileCardItem[]>([]);
  const [contactItems, setContactItems] = useState<ProfileCardItem[]>([]);
  const [addressItems, setAddressItems] = useState<ProfileCardItem[]>([]);
  const [positionItems, setPositionItems] = useState<string[]>([]);
  const [isContentScrolled, setIsContentScrolled] = useState(false);

  const handlePositionUpdate = useCallback((positions: string[]) => {
    setPositionItems(positions);

    // Cập nhật position items trong basicInfoItems
    setBasicInfoItems((prevItems) =>
      prevItems.map((item) =>
        item.dataField === "position"
          ? {
              ...item,
              editorOptions: {
                ...item.editorOptions,
                items: positions,
              },
            }
          : item
      )
    );
  }, []);
  const handlePasswordSave = useCallback(() => {
    notify(
      {
        message: "Password Changed",
        position: { at: "bottom center", my: "bottom center" },
      },
      "success"
    );
    setIsChangedPasswordPopupOpened(false); // optionally close the popup
  }, []);

  const dataChanged = useCallback(
    (data: Partial<User>) => {
      if (profileData) {
        setProfileData({ ...profileData, ...data });
        setIsDataChanged(true);
      }
    },
    [profileData]
  );

  const changePassword = useCallback(() => {
    setIsChangedPasswordPopupOpened(true);
  }, []);

  const handleContentScrolled = useCallback((reachedTop) => {
    setIsContentScrolled(!reachedTop);
  }, []);

  const setSavedData = useCallback(
    (data = profileData) => {
      if (data) {
        setSavedProfileData(JSON.parse(JSON.stringify(data)));
      }
    },
    [profileData]
  );

  const onCancel = useCallback(() => {
    if (savedProfileData) {
      setProfileData(savedProfileData);
      setSavedData();
      setIsDataChanged(false);
    }
  }, [savedProfileData, setSavedData]);

  const onSave = useCallback(async () => {
    if (!profileData || !currentUser) return;

    setIsLoading(true);
    try {
      const success = await service.updateUserProfile(
        currentUser.id,
        profileData
      );
      if (success) {
        notify(
          {
            message: "Profile updated successfully",
            position: {
              at: "bottom center",
              my: "bottom center",
            },
          },
          "success"
        );
        setIsDataChanged(false);
        setSavedData();
      } else {
        notify(
          {
            message: "Failed to update profile",
            position: {
              at: "bottom center",
              my: "bottom center",
            },
          },
          "error"
        );
      }
    } catch (error) {
      notify(
        {
          message: "An error occurred while updating profile",
          position: {
            at: "bottom center",
            my: "bottom center",
          },
        },
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [profileData, currentUser, setSavedData]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load profile data first
        const userData = await service.getCurrentUserProfile(currentUser.id);
        if (userData) {
          setProfileData(userData);
          setSavedData(userData);
        }

        // Load form items với userData để pre-load positions
        const [basicItems, contactItems, addressItems] = await Promise.all([
          service.getBasicInfoItems(handlePositionUpdate, userData as any), // Pass userData here
          Promise.resolve(service.getContactItems()),
          Promise.resolve(service.getAddressItems()),
        ]);

        setBasicInfoItems(basicItems);
        setContactItems(contactItems);
        setAddressItems(addressItems);
      } catch (error) {
        console.error("Error loading user profile:", error);
        notify(
          {
            message: "Failed to load profile data",
            position: {
              at: "bottom center",
              my: "bottom center",
            },
          },
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  return (
    <div className="view-host user-profile">
      <div className="view-wrapper">
        <Toolbar
          className={`theme-dependent ${isContentScrolled ? "scrolled" : ""}`}
        >
          <Item location="before">
            <div style={{ fontWeight: "bold", fontSize: "19px" }}>
              Trang cá nhân
            </div>
          </Item>
          <Item location="after" locateInMenu="never">
            <Button
              className="cancel-button"
              text="Cancel"
              disabled={!isDataChanged}
              stylingMode="outlined"
              type="normal"
              onClick={onCancel}
            />
          </Item>
          <Item location="after" locateInMenu="never">
            <Button
              disabled={!isDataChanged}
              text="Save"
              icon="save"
              type="default"
              stylingMode="contained"
              onClick={onSave}
            />
          </Item>
        </Toolbar>
        <UserProfileContentWithLoadPanel
          basicInfoItems={basicInfoItems}
          contactItems={contactItems}
          addressItems={addressItems}
          profileData={profileData}
          handleChangePasswordClick={changePassword}
          handleDataChanged={dataChanged}
          handleContentScrolled={handleContentScrolled}
          hasData={!isLoading}
          loading={isLoading}
          panelProps={{
            container: ".view-wrapper",
            position: { of: ".content" },
          }}
        />
        <ChangeProfilePasswordForm
          visible={isChangePasswordPopupOpened}
          setVisible={setIsChangedPasswordPopupOpened}
          onSave={handlePasswordSave}
          userId={currentUser?.id || ""}
        />
      </div>
    </div>
  );
};
