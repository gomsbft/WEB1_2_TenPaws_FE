import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { GoChevronRight } from "react-icons/go";
import MyPageModal from '../../components/MyPageModal';
import Header from '../../components/Header';

import matching from '../../assets/image/matching.png';
import check from '../../assets/image/check.png';
import complete from '../../assets/image/complete.png';
import bar from '../../assets/image/bar.png';
import mainImage from '../../assets/image/mainimage.webp'


// 유저 정보 타입 정의
interface UserInfo {
  email: string;
  username: string;
  birthdate: string;
  phoneNumber: string;
  address: string;
  preferredSize: string;
  preferredPersonality: string;
  preferredExerciseLevel: number;
  password: string;
}

interface PetInfo {
  id: number;
  pet: {
    petId: number;
    species: string;
    size: string;
    age: string;
    personality: string;
    exerciseLevel: number;
    imageUrls: string[];
  };
  userId: number;
  applyDate: string;
  applyStatus: string;
}


const MyPageUser: React.FC = () => {
  const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [isApplyModalOpen, setApplyModalOpen] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    email: "",
    username: "",
    birthdate: "",
    phoneNumber: "",
    address: "",
    preferredSize: "",
    preferredPersonality: "",
    preferredExerciseLevel: 0,
    password: ""
  });

  const [petInfo, setPetInfo] = useState<PetInfo>({
    id: 0,
    pet: {
      petId: 0,
      species: "",
      size: "",
      age: "",
      personality: "",
      exerciseLevel: 0,
      imageUrls: [],
    },
    userId: 0,
    applyDate: "",
    applyStatus: ""
  });

  const [passwordError, setPasswordError] = useState<string | null>(null); // 비밀번호 오류 메시지 상태
  const [Id, setId] = useState<string>("")

  
  // const url = "http://15.164.103.160:8080"

  // ID 불러오기
  useEffect(() => {
    const userId = async () => {
      try {
        const response = await axios.get(`/api/v1/features/check-id`);
        setId(response.data);
      } catch(error) {
        console.error("유저 ID를 불러오는 중 오류 발생:", error);
      }
    };
    userId();
  }, [])

  // 유저, 펫 정보 가져오기
  useEffect(() => {
    const userInfo = async () => {
      try {
        const response = await axios.get<UserInfo>(`/api/v1/users/${Id}`);
        setUserInfo(response.data);
      } catch (error) {
        console.error('유저 정보를 불러오는 중 오류 발생:', error);
      }
    };
    userInfo();

  }, [Id]);

  useEffect(() => {
    const petInfo = async () => {
      try {
        const response = await axios.get<PetInfo>(`/api/v1/applypet/${Id}/list`);
        setPetInfo(response.data);
      }catch(error) {
        console.error('동물 정보를 불러오는 중 오류 발생:', error);
      }
    };
    petInfo();
  }, [Id])

  const deleteApply = async() => {
    try{
      await axios.post(`/api/v1/applypet/${petInfo.id}/cancel?userId=${Id}`);
    }catch(error) {
      console.error("입양 취소 중 오류가 발생했습니다", error);
    }
  }


  // 비밀번호 유효성 검증 함수
  const validatePassword = (password: string): string | null => {
    if (password.length < 8 || password.length > 12) {
      return '비밀번호는 8자 이상 12자 이하로 설정해야 합니다.';
    }
    if (!/[A-Z]/.test(password)) {
      return '비밀번호에 최소 1개의 대문자가 포함되어야 합니다.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return '비밀번호에 최소 1개의 특수문자가 포함되어야 합니다.';
    }
    return null;
  };
  

  // 입력값 변경 처리
  const editChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
  
    if (userInfo) { // 먼저 userInfo가 null이 아닌지 확인
      setUserInfo((prev) =>
        prev ? { ...prev, [name]: value } : prev
      );
  
      if (name === 'password') {
        const error = validatePassword(value);
        setPasswordError(error);
      }
    }
  };
  

  // 정보 수정 제출

  const editSubmit = async (): Promise<void> => {
    if (!userInfo) return;

    // 비밀번호 검증
    if (passwordError) { // passwordError 상태로 검증
      alert(passwordError);
      return;
    }


    try {
      await axios.put(`/api/v1/users/${Id}`, userInfo);
      alert('정보가 수정되었습니다.');
      setEditModalOpen(false);
    } catch (error) {
      console.error('정보 수정 중 오류 발생:', error);
      alert('정보 수정에 실패했습니다.');
    }
  };

  // 회원 탈퇴 처리
  const DeleteAccount = async (): Promise<void> => {
    try {
      await axios.delete(`/api/v1/users/${Id}`);
      alert('회원탈퇴가 완료되었습니다.');
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('회원탈퇴 중 오류 발생:', error);
      alert('회원탈퇴에 실패했습니다.');
    }
  };




  if (!userInfo) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="relative">
      <Header />
      <div className="flex flex-col items-center">
        <section className="flex flex-col items-center w-full max-w-lg gap-4 mt-8">
          <div className="flex justify-center">
            <h3 className='text-2xl font-bold'>마이페이지</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex justify-between w-full">
              <p className="text-xl font-bold text-mainColor">이름</p>
              <p className='text-lg'>{userInfo.username}</p>
            </div>
            <div className="flex justify-between w-full">
              <p className="text-xl font-bold text-mainColor">주소</p>
              <p className='text-lg'>{userInfo.address}</p>
            </div>
            <div className="flex justify-between w-full">
              <p className="text-xl font-bold text-mainColor">메일(아이디)</p>
              <p className='text-lg'>{userInfo.email}</p>
            </div>
            <div className="flex justify-between w-full">
              <p className="text-xl font-bold text-mainColor">생년월일</p>
              <p className='text-lg'>{userInfo.birthdate}</p>
            </div>
            <div className="flex justify-between w-full">
              <p className="text-xl font-bold text-mainColor">전화번호</p>
              <p className='text-lg'>{userInfo.phoneNumber}</p>
            </div>
            <div className="flex justify-between w-full">
              <p className="text-xl font-bold text-mainColor">선호동물</p>
              <span className='text-lg'>{userInfo.preferredSize}</span>/
              <span className='text-lg'>{userInfo.preferredPersonality}</span>/
              <span className='text-lg'>{userInfo.preferredExerciseLevel}</span>
            </div>
          </div>
          <div className="flex gap-32 mt-10">
            <button
              className="text-lg text-mainColor"
              onClick={() => setEditModalOpen(true)}
            >
              정보수정
            </button>
            <button
              className="text-lg text-cancelColor"
              onClick={() => setDeleteModalOpen(true)}
            >
              회원탈퇴
            </button>
          </div>
        </section>
        <section className="flex flex-col items-center justify-center w-full max-w-lg gap-4 mt-8">
          <div>
            <h3 className="mb-10 text-xl font-bold">신청하신 입양 정보</h3>
          </div>
        </section>
        {petInfo && petInfo.pet && (
          <section className="relative flex flex-col items-center w-full max-w-lg my-20 overflow-hidden border border-solid rounded-lg border-mainColor">
            <div>
              <img 
                src={petInfo.pet.imageUrls && petInfo.pet.imageUrls.length > 0 
                  ? petInfo.pet.imageUrls[0] 
                  : mainImage} 
                alt="동물 사진" 
              />
            </div>
            <div className="flex flex-col items-center gap-3 my-5">
              <p>{petInfo.pet.species} / {petInfo.pet.size} / {petInfo.pet.age} / {petInfo.pet.personality} / {petInfo.pet.exerciseLevel}</p>
            </div>
            <div className="flex flex-col items-center gap-3 my-5">
              <button className='text-cancelColor' onClick={() => setApplyModalOpen(true)}>입양 신청 취소</button>
            </div>
          </section>
        )}

        {/* 입양 취소 모달 */}
        <MyPageModal isOpen={isApplyModalOpen} onClose={() => setApplyModalOpen(false)}>
          <h3 className="mb-4 text-lg font-bold">입양 취소 하시겠습니까?</h3>
          <div className="flex justify-end gap-4 mt-6">
            <button className="text-mainColor" onClick={deleteApply}>
              네
            </button>
            <button className="text-cancelColor" onClick={() => setApplyModalOpen(false)}>
              아니오
            </button>
          </div>
        </MyPageModal>

        {/* 수정 모달 */}
        <MyPageModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)}>
          <h3 className="mb-4 text-lg font-bold">정보 수정</h3>
          <div className="flex flex-col gap-4">
            <label>
              이름:
              <input
                type="text"
                name="username"
                value={userInfo?.username || ''} // userInfo가 null이면 빈 문자열 사용
                onChange={editChange}
                className="block w-full p-2 border rounded"
              />
            </label>
            <label>
              비밀번호:
              <input
                type="password"
                name="password"
                value={userInfo.password}
                onChange={editChange}
                className="block w-full p-2 border rounded"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </label>
            <label>
              생년월일:
              <input
                type="text"
                name="birthdate"
                value={userInfo.birthdate}
                onChange={editChange}
                className="block w-full p-2 border rounded"
              />
            </label>
            <label>
              전화번호:
              <input
                type="text"
                name="phoneNumber"
                value={userInfo.phoneNumber}
                onChange={editChange}
                className="block w-full p-2 border rounded"
              />
            </label>
            <label>
              주소:
              <input
                type="text"
                name="address"
                value={userInfo.address}
                onChange={editChange}
                className="block w-full p-2 border rounded"
              />
            </label>
            <label>
              선호동물:
              <Link to='/prefer'>
                <button className="flex items-center w-full p-2 border rounded">
                  {userInfo.preferredSize} / {userInfo.preferredPersonality} / {userInfo.preferredExerciseLevel}
                  <GoChevronRight />
                </button>
              </Link>
            </label>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button className="text-mainColor" onClick={editSubmit}>
              수정완료
            </button>
            <button className="text-cancelColor" onClick={() => setEditModalOpen(false)}>
              취소
            </button>
          </div>
        </MyPageModal>
        {/* 회원탈퇴 모달 */}
        <MyPageModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <h3 className="mb-4 text-lg font-bold">정말로 탈퇴하시겠습니까?</h3>
          <div className="flex justify-end gap-4 mt-6">
            <button className="text-mainColor" onClick={DeleteAccount}>
              네
            </button>
            <button className="text-cancelColor" onClick={() => setDeleteModalOpen(false)}>
              아니오
            </button>
          </div>
        </MyPageModal>
      </div>
    </div>
  );
};

export default MyPageUser;

