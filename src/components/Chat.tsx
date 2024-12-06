import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import axios from "axios";
import { Client } from "@stomp/stompjs";

//gyutest@gmail.com (일반)
//gyutest123

//gyutest2@gmail.com (보호소)
//gyutest123

interface userChatRoom {
  chatRoomId: number;
  unReadCount: number;
  oppositeEmail: string;
  oppositeName: string;
  userEmail: string;
}

interface chatUser {
  username: string;
  email: string;
}

interface chatMessage {
  message: string;
  chatDate: string;
  senderEmail: string;
  senderName: string;
  unRead: number;
}

const Chat = () => {
  const [makeChatRoom, setMakeChatRoom] = useState(false);
  const [chatRoomOpen, setChatRoomOpen] = useState(false);
  const [oppositeEmail, setOppositeEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userChatRoom, setUserChatRoom] = useState<userChatRoom[]>([]);
  const [chatUser, setChatUser] = useState<chatUser[]>([]);
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState<chatMessage[]>([]);
  const clientRef = useRef<Client | null>(null);
  const [message, setMessage] = useState("");

  const handlemakechatroom = () => {
    setMakeChatRoom(!makeChatRoom);
    setChatRoomOpen(false);
  };

  const handlechatroomopen = async (RoomId: number) => {
    console.log('채팅방 열기 - 룸ID:', RoomId);
    setChatRoomOpen(true);
    setMakeChatRoom(false);
    setChatRoomId(RoomId);
    
    try {
      // 이전 메시지 
      const messageResponse = await axios.get(
        `http://15.164.103.160:8080/api/v1/chatmessages/${RoomId}`,
        {
          headers: {
            Authorization: localStorage.getItem("accessToken")
          }
        }
      );
      setChatMessage(messageResponse.data);
  
      // 읽음 처리 
      await axios.put(
        `http://15.164.103.160:8080/api/v1/unread/init`,
        {
          userEmail: userEmail,
          chatRoomId: RoomId
        },
        {
          headers: {
            Authorization: localStorage.getItem("accessToken")
          }
        }
      );
  
      // 채팅방 목록 새로고침 
      await fetchChatroom();
      
    } catch (error) {
      console.error("채팅방 열기 실패", error);
    }
  };

  // 웹 소켓
  useEffect(() => {
    const token = localStorage.getItem("accessToken")?.replace('Bearer ', '');
    if (!token) return;
  
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
    }
  
    const client = new Client({
      brokerURL: `ws://15.164.103.160:8080/ws?authorization=${token}`,
      connectHeaders: {
        Authorization: token
      },
      disconnectHeaders: {
        Authorization: token
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (chatRoomId) {
          client.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
            const receivedMessage = JSON.parse(message.body);
            setChatMessage(prev => [...prev, receivedMessage]);
          });
        }
      }
    });
  
    try {
      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error('WebSocket 연결 에러:', error);
    }
  
    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [chatRoomId]);

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }
  
    if (!clientRef.current?.connected) {
      console.error('WebSocket이 연결되어 있지 않습니다.');
      return;
    }
  
    const messageData = {
      message: message,
      senderEmail: userEmail,
      receiverEmail: oppositeEmail
    };
  
    try {
      clientRef.current.publish({
        destination: `/app/chat/send/${chatRoomId}`,
        body: JSON.stringify(messageData)
      });
      setMessage("");
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  //회원 목록 조회
  useEffect(() => {
    const fetchChatUser = async () => {
      try {
        const response = await axios.get("http://15.164.103.160:8080/api/v1/users/chat-users", {
          headers: {
            Authorization: localStorage.getItem("accessToken")
          }
        });
        setChatUser(response.data);
      } catch (error) {
        console.error("회원 목록 조회에 실패하였습니다.", error);
      }
    };
    fetchChatUser();
  }, []);

  // 현재 사용자의 이메일 추출
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.email;
      setUserEmail(email);
    }
  }, [userEmail]);

  //채팅창 생성시 새로고침 함수
  const fetchChatroom = async () => {
    try {
      const response = await axios.get("http://15.164.103.160:8080/api/v1/chatrooms/user", {
        headers: {
          Authorization: localStorage.getItem("accessToken")
        }
      });
      setUserChatRoom(response.data);
    } catch (error) {
      console.error("목록 조회 실패", error);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchChatroom();
    }
  }, [userEmail]);

  //채팅방 생성
  const handleCreateChat = async () => {
    try {
      await axios.post(
        "http://15.164.103.160:8080/api/v1/chatrooms",
        {
          userEmail,
          oppositeEmail
        },
        {
          headers: {
            Authorization: localStorage.getItem("accessToken"),
            "Content-Type": "application/json"
          }
        }
      );
      alert("채팅방이 생성 되었습니다.");
      await fetchChatroom(); // 새로고침
      setMakeChatRoom(false);
    } catch (error) {
      console.error("채팅방 생성 실패", error);
      alert("채팅방 생성에 실패하였습니다.");
    }
  };

  //참여중인 채팅방 목록 조회
  useEffect(() => {
    const fetchChatroom = async () => {
      try {
        const response = await axios.get("http://15.164.103.160:8080/api/v1/chatrooms/user", {
          headers: {
            Authorization: localStorage.getItem("accessToken")
          }
        });
        setUserChatRoom(response.data);
      } catch (error) {
        console.error("목록 조회 실패", error);
      }
    };
  
    if (userEmail) {
      fetchChatroom();
    }
  }, []);

  //채팅방 삭제
  const handleChatDelete = async () => {
    console.log(chatRoomId);
    try {
      await axios.delete(`http://15.164.103.160:8080/api/v1/chatrooms/${chatRoomId}`, {
        headers: {
          Authorization: localStorage.getItem("accessToken")
        }
      });
      alert("채팅방을 삭제 하였습니다.");
      await fetchChatroom();
      setChatRoomOpen(false);
    } catch (error) {
      console.error("채팅방 삭제 실패", error);
    }
  };

  // 스크롤 관리를 위한 ref 추가
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 스크롤 이동 함수
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 새 메시지가 추가될 때마다 스크롤 이동
  useEffect(() => {
    scrollToBottom();
  }, [chatMessage]); // chatMessage가 변경될 때마다 실행

  return (
    <div className="fixed bottom-[89px] right-2 z-50">
      <div>
        {/* 채팅방 생성 UI*/}

        {makeChatRoom && (
          <div className="bg-yellow-500 absolute -left-96 -top-16 w-96 h-56 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="p-5 ">
              <div className="pb-3 font-bold">채팅 할 대상을 선택하세요</div>
              <select
                className="w-full h-10 shadow-[0_0_15px_rgba(0,0,0,0.5)] p-2 mb-10 rounded-md"
                value={oppositeEmail}
                onChange={(e) => setOppositeEmail(e.target.value)}>
                <option value="">유저를 선택하세요</option>
                {chatUser.map((user) => (
                  <option key={user.email} value={user.email}>
                    {user.email}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="bg-blue-500 inline px-2 py-1 mx-5 rounded-md text-white font-bold cursor-pointer float-end"
              onClick={handleCreateChat}>
              생성
            </div>
          </div>
        )}

        {/* 채팅방 생성 버튼 */}
        <div
          className="bg-yellow-500 m-6 p-6 rounded-full font-bold text-[40px] w-16 h-16 flex justify-center items-center pl-[24.6px] pb-[35px] cursor-pointer  hover:scale-105 transition-transform"
          onClick={handlemakechatroom}>
          +
        </div>
      </div>

      {/* 채팅방 내부  */}
      {chatRoomOpen && (
        <div className="fixed bottom-[30px] right-[114px] z-50">
          <div className="bg-yellow-500 w-[384px] h-[590px] rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] ">
            {/* 헤더 */}
            {userChatRoom.map((item) => (
              <div className="bg-white p-3 rounded-t-lg flex justify-between " key={item.chatRoomId}>
                <div className="font-bold">{item.oppositeName}</div>
                <div className="cursor-pointer flex gap-3">
                  <div onClick={handleChatDelete}>🗑️</div>
                  <div onClick={() => setChatRoomOpen(false)}>✖️</div>
                </div>
              </div>
            ))}

            <div className="bg-white mx-3 mt-3 w-76 h-[477px] rounded-t-lg overflow-y-auto max-h-[500px] scrollbar-hide">
              {chatMessage.map((message, index) =>
                message.senderEmail === userEmail ? (
                  // 자신의 메시지
                  <div className="flex p-4 justify-end" key={message.chatDate + index}>
                    <div className="flex flex-col items-end">
                      <div className="text-sm pb-1.5 pr-1">{message.senderName}</div>
                      <div className="flex items-end gap-1">
                        <div className="p-2 rounded-xl bg-gray-300 break-words">{message.message}</div>
                      </div>
                    </div>
                    <div className="rounded-full w-10 h-10 min-w-10 min-h-10 ml-2">
                      <img src={logo} alt="logo" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  // 상대방의 메시지
                  <div className="flex p-4" key={message.chatDate + index}>
                    <div className="rounded-full w-10 h-10 min-w-10 min-h-10">
                      <img src={logo} alt="logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="ml-2 pb-1.5 text-sm">{message.senderName}</div>
                      <div className="flex items-end gap-1">
                        <div className="ml-2 p-2 rounded-xl bg-gray-300 break-words">{message.message}</div>
                      </div>
                    </div>
                  </div>
                )
              )}
              {/* 스크롤 위치 지정을 위한 더미 div */}
              <div ref={messageEndRef} />
            </div>

            <div className="bg-white mx-3 w-76 h-10 rounded-b-lg border-t-2 border-black flex justify-between">
    <input 
      type="text" 
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      className="w-80 focus:outline-none p-2 text-sm"
      placeholder="메시지를 입력하세요"
    />
    <div 
      onClick={sendMessage}
      className="text-3xl px-1 cursor-pointer hover:scale-105 transition-transform duration-300"
    >
      ➤
    </div>
  </div>
          </div>
        </div>
      )}

      {/* 채팅방1 아이콘 (목록 조회)*/}
      {userChatRoom.map((item) => (
        <div className="transition-transform hover:scale-105" key={item.chatRoomId}>
          <div
            className="bg-yellow-500 rounded-full w-16 h-16 m-6 items-center justify-center cursor-pointer"
            onClick={() => handlechatroomopen(item.chatRoomId)}>
            <div className="absolute top-13 right-5">
              <div className=" bg-red-600 text-white rounded-full px-1.5 min-w-[20px] h-[20px] flex items-center justify-center text-sm font-bold ">
                {item.unReadCount > 99 ? (
                  <>
                    {item.unReadCount}
                    <span className="pb-[4px] pl-[1px]">+</span>
                  </>
                ) : (
                  item.unReadCount
                )}
              </div>
            </div>
            <div className="p-3 pl-3.5 pt-3.5 font-bold text-3xl text-center ">{item.oppositeName.charAt(0)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Chat;
